import { describe, expect, it } from "vitest";
import {
  compareYears,
  comparePeriods,
  sevenDayWindow,
  summarise,
  trailingChange,
  type PricePoint,
} from "@/domain/price";

const points = (entries: [string, number][]): PricePoint[] =>
  entries.map(([date, price]) => ({ date, price }));

describe("summarise", () => {
  it("returns an empty summary for no observations", () => {
    const summary = summarise([]);
    expect(summary.count).toBe(0);
    expect(summary.average).toBeNull();
    expect(summary.changeAbsolute).toBeNull();
  });

  it("computes count, average, min and max", () => {
    const summary = summarise(
      points([
        ["2026-09-01", 50],
        ["2026-09-02", 60],
        ["2026-09-03", 40],
      ])
    );
    expect(summary.count).toBe(3);
    expect(summary.average).toBe(50);
    expect(summary.min).toBe(40);
    expect(summary.max).toBe(60);
  });

  it("measures change from the first to the last date, not input order", () => {
    const summary = summarise(
      points([
        ["2026-09-03", 55],
        ["2026-09-01", 50],
        ["2026-09-02", 52],
      ])
    );
    expect(summary.first?.date).toBe("2026-09-01");
    expect(summary.last?.date).toBe("2026-09-03");
    expect(summary.changeAbsolute).toBe(5);
    expect(summary.changePercent).toBe(10);
  });

  it("handles a single observation", () => {
    const summary = summarise(points([["2026-09-01", 50]]));
    expect(summary.count).toBe(1);
    expect(summary.average).toBe(50);
    expect(summary.changeAbsolute).toBe(0);
    expect(summary.changePercent).toBe(0);
  });
});

describe("comparePeriods", () => {
  it("computes deltas between the two periods", () => {
    const a = points([
      ["2026-09-01", 50],
      ["2026-09-02", 60],
    ]);
    const b = points([
      ["2023-09-01", 100],
      ["2023-09-02", 120],
    ]);
    const comparison = comparePeriods(a, b);

    expect(comparison.a.average).toBe(55);
    expect(comparison.b.average).toBe(110);
    // a minus b, relative to b: period A sits 50% below the baseline period.
    // The sign must read as "A is lower than B", not the other way round.
    expect(comparison.averageDelta).toBe(-55);
    expect(comparison.averagePercent).toBe(-50);
    expect(comparison.minDelta).toBe(-50);
    expect(comparison.maxDelta).toBe(-60);
  });

  it("aligns unequal-length periods by day index", () => {
    const a = points([
      ["2026-09-01", 50],
      ["2026-09-02", 51],
      ["2026-09-03", 52],
    ]);
    const b = points([["2023-09-01", 100]]);
    const comparison = comparePeriods(a, b);

    expect(comparison.overlay).toHaveLength(3);
    expect(comparison.overlay[0]).toMatchObject({ index: 1, aPrice: 50, bPrice: 100 });
    // The shorter period simply stops; nothing is invented to fill it.
    expect(comparison.overlay[1].bPrice).toBeNull();
    expect(comparison.overlay[2].bPrice).toBeNull();
  });

  it("reports a positive delta when the current period is the higher one", () => {
    const comparison = comparePeriods(
      points([["2026-09-01", 120]]),
      points([["2023-09-01", 100]])
    );
    expect(comparison.averageDelta).toBe(20);
    expect(comparison.averagePercent).toBe(20);
  });

  it("survives an empty period on either side", () => {
    const comparison = comparePeriods(points([["2026-09-01", 50]]), []);
    expect(comparison.b.count).toBe(0);
    expect(comparison.averageDelta).toBeNull();
    expect(comparison.averagePercent).toBeNull();
    expect(comparison.overlay).toHaveLength(1);
  });

  it("returns an empty overlay when both periods are empty", () => {
    expect(comparePeriods([], []).overlay).toHaveLength(0);
  });
});

describe("compareYears", () => {
  it("compares each year against the most recent one", () => {
    const byYear = new Map<number, PricePoint[]>([
      [2026, points([["2026-09-01", 50], ["2026-09-02", 50]])],
      [2023, points([["2023-09-01", 100], ["2023-09-02", 100]])],
      [2021, points([["2021-09-01", 40], ["2021-09-02", 40]])],
    ]);

    const rows = compareYears(byYear, { fromMonthDay: "09-01", toMonthDay: "09-02" });

    expect(rows.map((row) => row.year)).toEqual([2026, 2023, 2021]);
    expect(rows[0].averageDeltaVsLatest).toBe(0);
    // 2026 average (50) minus 2023 average (100): current year is 50 lower.
    expect(rows[1].averageDeltaVsLatest).toBe(-50);
    expect(rows[1].averagePercentVsLatest).toBe(-50);
    // 2026 average (50) minus 2021 average (40): current year is 10 higher.
    expect(rows[2].averageDeltaVsLatest).toBe(10);
    expect(rows[2].averagePercentVsLatest).toBe(25);
  });

  it("builds the date window per year", () => {
    const byYear = new Map<number, PricePoint[]>([[2026, points([["2026-03-15", 50]])]]);
    const rows = compareYears(byYear, { fromMonthDay: "03-01", toMonthDay: "03-31" });
    expect(rows[0].from).toBe("2026-03-01");
    expect(rows[0].to).toBe("2026-03-31");
  });

  it("returns nothing when given no years", () => {
    expect(compareYears(new Map(), { fromMonthDay: "01-01", toMonthDay: "01-31" })).toEqual([]);
  });

  it("handles a year with no observations without inventing an average", () => {
    const byYear = new Map<number, PricePoint[]>([
      [2026, points([["2026-09-01", 50]])],
      [2025, []],
    ]);
    const rows = compareYears(byYear, { fromMonthDay: "09-01", toMonthDay: "09-30" });
    expect(rows[1].summary.count).toBe(0);
    expect(rows[1].summary.average).toBeNull();
    expect(rows[1].averagePercentVsLatest).toBeNull();
  });
});

describe("sevenDayWindow", () => {
  const asOf = new Date("2026-09-14T00:00:00Z");

  it("returns today plus the previous seven days", () => {
    const series = points([
      ["2026-09-05", 1], // outside the window
      ["2026-09-07", 2], // boundary: exactly seven days back
      ["2026-09-10", 3],
      ["2026-09-14", 4], // today
    ]);
    const window = sevenDayWindow(series, asOf);
    expect(window.map((p) => p.date)).toEqual(["2026-09-07", "2026-09-10", "2026-09-14"]);
  });

  it("does not fabricate points for missing days", () => {
    // Weekends and holidays leave gaps; the window reports only what exists.
    const series = points([
      ["2026-09-10", 3],
      ["2026-09-14", 4],
    ]);
    expect(sevenDayWindow(series, asOf)).toHaveLength(2);
  });

  it("returns an empty window when there is no data", () => {
    expect(sevenDayWindow([], asOf)).toEqual([]);
  });
});

describe("trailingChange", () => {
  it("compares the latest point against the nearest one at or before the target", () => {
    const series = points([
      ["2026-09-01", 50],
      ["2026-09-07", 55],
      ["2026-09-14", 60],
    ]);
    const change = trailingChange(series, 7);
    expect(change.latest?.date).toBe("2026-09-14");
    expect(change.previous?.date).toBe("2026-09-07");
    expect(change.absolute).toBe(5);
    expect(change.percent).toBeCloseTo(9.09, 1);
  });

  it("falls back to the earliest point when the target predates the series", () => {
    const series = points([
      ["2026-09-12", 50],
      ["2026-09-14", 60],
    ]);
    const change = trailingChange(series, 90);
    expect(change.previous?.date).toBe("2026-09-12");
    expect(change.absolute).toBe(10);
  });

  it("reports no change when only one observation exists", () => {
    const change = trailingChange(points([["2026-09-14", 60]]), 7);
    expect(change.latest?.price).toBe(60);
    expect(change.previous).toBeNull();
    expect(change.absolute).toBeNull();
  });

  it("handles an empty series", () => {
    expect(trailingChange([], 7)).toEqual({
      latest: null,
      previous: null,
      absolute: null,
      percent: null,
    });
  });
});
