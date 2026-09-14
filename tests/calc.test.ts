import { describe, expect, it } from "vitest";
import {
  ValidationError,
  allocatedTonnes,
  assertStageCapacity,
  assertStagesMatchContract,
  deliveredTonnes,
  isActiveDo,
  progress,
} from "@/domain/calc";
import type { DoStatus } from "@/domain/types";

const order = (status: DoStatus, planned: number, actual: number | null = null) => ({
  status,
  plannedVolumeTonnes: planned,
  actualVolumeTonnes: actual,
});

describe("allocated versus delivered tonnage", () => {
  it("counts every non-cancelled order towards allocation", () => {
    const orders = [
      order("draft", 10_000),
      order("terjadwal", 20_000),
      order("dalam_pengiriman", 25_000),
      order("selesai", 30_000, 29_500),
      order("dibatalkan", 50_000),
    ];
    expect(allocatedTonnes(orders)).toBe(85_000);
  });

  it("counts only completed orders towards delivery, using actual tonnage", () => {
    const orders = [
      order("selesai", 30_000, 29_500),
      order("selesai", 25_000, 25_120),
      // In transit: planned but not yet delivered.
      order("dalam_pengiriman", 25_000),
    ];
    expect(deliveredTonnes(orders)).toBe(54_620);
  });

  it("does not treat an in-transit order as delivered", () => {
    // The distinction this module exists to protect: a contract must not look
    // shipped while the cargo is still at anchorage.
    const orders = [order("dalam_pengiriman", 25_000, null)];
    expect(allocatedTonnes(orders)).toBe(25_000);
    expect(deliveredTonnes(orders)).toBe(0);
  });

  it("ignores a cancelled order even if it carries an actual volume", () => {
    const orders = [order("dibatalkan", 25_000, 24_000)];
    expect(allocatedTonnes(orders)).toBe(0);
    expect(deliveredTonnes(orders)).toBe(0);
  });

  it("classifies statuses consistently", () => {
    expect(isActiveDo("draft")).toBe(true);
    expect(isActiveDo("selesai")).toBe(true);
    expect(isActiveDo("dibatalkan")).toBe(false);
  });
});

describe("progress", () => {
  it("computes remaining and percentage", () => {
    expect(progress(100_000, 25_000)).toEqual({
      planned: 100_000,
      delivered: 25_000,
      remaining: 75_000,
      percent: 25,
    });
  });

  it("returns zero percent rather than dividing by zero", () => {
    expect(progress(0, 0).percent).toBe(0);
  });

  it("clamps remaining at zero when over-delivered", () => {
    const result = progress(100, 120);
    expect(result.remaining).toBe(0);
    expect(result.percent).toBe(120);
  });
});

describe("stage volumes must match the contract", () => {
  it("accepts stages that add up exactly", () => {
    expect(() =>
      assertStagesMatchContract(300_000, [
        { plannedVolumeTonnes: 75_000 },
        { plannedVolumeTonnes: 75_000 },
        { plannedVolumeTonnes: 75_000 },
        { plannedVolumeTonnes: 75_000 },
      ])
    ).not.toThrow();
  });

  it("tolerates sub-cent floating point drift", () => {
    expect(() =>
      assertStagesMatchContract(100, [
        { plannedVolumeTonnes: 33.33 },
        { plannedVolumeTonnes: 33.33 },
        { plannedVolumeTonnes: 33.34 },
      ])
    ).not.toThrow();
  });

  it("rejects an under-allocated contract and reports the shortfall", () => {
    expect(() =>
      assertStagesMatchContract(300_000, [{ plannedVolumeTonnes: 200_000 }])
    ).toThrow(ValidationError);
  });

  it("rejects an over-allocated contract", () => {
    expect(() =>
      assertStagesMatchContract(100_000, [
        { plannedVolumeTonnes: 60_000 },
        { plannedVolumeTonnes: 60_000 },
      ])
    ).toThrow(/tidak sama/i);
  });

  it("requires at least one stage", () => {
    expect(() => assertStagesMatchContract(100_000, [])).toThrow(/minimal satu tahap/i);
  });
});

describe("stage capacity", () => {
  const stage = { stageNo: 2, plannedVolumeTonnes: 75_000 };

  it("accepts a delivery order within the remaining quota", () => {
    expect(() => assertStageCapacity(stage, 50_000, 25_000)).not.toThrow();
  });

  it("accepts an order that exactly fills the stage", () => {
    expect(() => assertStageCapacity(stage, 50_000, 25_000)).not.toThrow();
    expect(() => assertStageCapacity(stage, 0, 75_000)).not.toThrow();
  });

  it("rejects an order that exceeds the remaining quota", () => {
    expect(() => assertStageCapacity(stage, 50_000, 30_000)).toThrow(ValidationError);
  });

  it("names the stage and the remaining quota in the error", () => {
    try {
      assertStageCapacity(stage, 60_000, 20_000);
      throw new Error("expected a ValidationError");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("Tahap 2");
      expect(message).toContain("sisa");
    }
  });

  it("rejects a zero or negative volume", () => {
    expect(() => assertStageCapacity(stage, 0, 0)).toThrow(/lebih besar dari nol/i);
    expect(() => assertStageCapacity(stage, 0, -5)).toThrow(/lebih besar dari nol/i);
  });

  it("rejects any order once the stage is fully allocated", () => {
    expect(() => assertStageCapacity(stage, 75_000, 1)).toThrow(ValidationError);
  });
});
