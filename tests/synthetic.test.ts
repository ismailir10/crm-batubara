import { describe, expect, it } from "vitest";
import {
  PRICE_ANCHOR_DATE,
  SYNTHETIC_SOURCES,
  generateSeries,
  isTradingDay,
} from "@/server/price/synthetic";
import { MockCoalPriceProvider, getProvider, getProviders } from "@/server/price/mock-provider";

const UNTIL = new Date("2026-09-14T00:00:00Z");

describe("synthetic price generation", () => {
  it("is deterministic: the same source and end date reproduce the same series", () => {
    const source = SYNTHETIC_SOURCES[0];
    const first = generateSeries(source, UNTIL);
    const second = generateSeries(source, UNTIL);
    expect(first).toEqual(second);
  });

  it("produces a different series per source", () => {
    const a = generateSeries(SYNTHETIC_SOURCES[0], UNTIL);
    const b = generateSeries(SYNTHETIC_SOURCES[1], UNTIL);
    expect(a[0].price).not.toBe(b[0].price);
  });

  it("extends rather than rewrites history as the end date moves", () => {
    // The guarantee that makes re-seeding on a later day safe.
    const earlier = generateSeries(SYNTHETIC_SOURCES[0], new Date("2026-09-01T00:00:00Z"));
    const later = generateSeries(SYNTHETIC_SOURCES[0], UNTIL);
    expect(later.slice(0, earlier.length)).toEqual(earlier);
    expect(later.length).toBeGreaterThan(earlier.length);
  });

  it("starts at the anchor date and never runs past the end date", () => {
    const series = generateSeries(SYNTHETIC_SOURCES[0], UNTIL);
    expect(series[0].date >= PRICE_ANCHOR_DATE).toBe(true);
    expect(series[series.length - 1].date <= "2026-09-14").toBe(true);
  });

  it("emits trading days only, leaving weekends and holidays as gaps", () => {
    const series = generateSeries(SYNTHETIC_SOURCES[0], UNTIL);
    const dates = new Set(series.map((point) => point.date));

    // 2026-09-12 and 2026-09-13 fall on a Saturday and Sunday.
    expect(dates.has("2026-09-12")).toBe(false);
    expect(dates.has("2026-09-13")).toBe(false);
    // Indonesian Independence Day.
    expect(dates.has("2026-08-17")).toBe(false);
    // New Year's Day.
    expect(dates.has("2026-01-01")).toBe(false);
  });

  it("produces positive, plausibly-scaled prices", () => {
    for (const source of SYNTHETIC_SOURCES) {
      const series = generateSeries(source, UNTIL);
      for (const point of series) {
        expect(point.price).toBeGreaterThan(0);
        expect(point.price).toBeLessThan(1000);
      }
    }
  });

  it("covers more than three years, so multi-year comparison has data", () => {
    const series = generateSeries(SYNTHETIC_SOURCES[0], UNTIL);
    const years = new Set(series.map((point) => point.date.slice(0, 4)));
    expect(years.size).toBeGreaterThanOrEqual(5);
  });

  it("identifies trading days correctly", () => {
    expect(isTradingDay(new Date("2026-09-14T00:00:00Z"))).toBe(true); // Monday
    expect(isTradingDay(new Date("2026-09-12T00:00:00Z"))).toBe(false); // Saturday
    expect(isTradingDay(new Date("2026-01-01T00:00:00Z"))).toBe(false); // holiday
  });
});

describe("mock provider", () => {
  it("registers one provider per synthetic source", () => {
    const providers = getProviders();
    expect(providers).toHaveLength(SYNTHETIC_SOURCES.length);
    expect(providers.every((provider) => provider.isMock)).toBe(true);
  });

  it("declares itself as a mock adapter, by name", () => {
    // The deck and the UI both rely on this string being honest.
    const provider = getProvider("ICI-3");
    expect(provider?.adapterName).toBe("MockCoalPriceProvider");
    expect(provider).toBeInstanceOf(MockCoalPriceProvider);
  });

  it("returns null for an unknown source rather than inventing one", () => {
    expect(getProvider("DOES-NOT-EXIST")).toBeNull();
  });

  it("returns observations only within the requested range", async () => {
    const provider = getProvider("ICI-3")!;
    const from = new Date("2026-09-01T00:00:00Z");
    const observations = await provider.fetchRange(from, UNTIL);

    expect(observations.length).toBeGreaterThan(0);
    for (const observation of observations) {
      expect(observation.observationDate >= "2026-09-01").toBe(true);
      expect(observation.observationDate <= "2026-09-14").toBe(true);
      expect(observation.unit).toBe("USD/tonne");
      expect(observation.currency).toBe("USD");
    }
  });

  it("returns the same data on repeated fetches", async () => {
    const provider = getProvider("CCI-5500")!;
    const from = new Date("2026-08-01T00:00:00Z");
    const first = await provider.fetchRange(from, UNTIL);
    const second = await provider.fetchRange(from, UNTIL);
    expect(first).toEqual(second);
  });

  it("covers both regions named in the discovery document", () => {
    const regions = new Set(getProviders().map((provider) => provider.region));
    expect(regions).toEqual(new Set(["Singapore", "China"]));
    expect(getProviders().filter((p) => p.region === "Singapore")).toHaveLength(2);
    expect(getProviders().filter((p) => p.region === "China")).toHaveLength(2);
  });
});
