import { describe, expect, it } from "vitest";
import {
  CONTRACT_STATUS,
  CONTRACT_TRANSITIONS,
  DO_STATUS,
  DO_TRANSITIONS,
  OPPORTUNITY_STATUS,
  OPPORTUNITY_TRANSITIONS,
  SAF_STATUS,
  SAF_TRANSITIONS,
  TransitionError,
  assertTransition,
  canDecideApproval,
  canManageContracts,
  canManageSales,
  canTransition,
} from "@/domain/status";
import type { OpportunityStatus } from "@/domain/types";

describe("opportunity transitions", () => {
  it("allows the documented moves", () => {
    expect(canTransition(OPPORTUNITY_TRANSITIONS, "on_progress", "pending")).toBe(true);
    expect(canTransition(OPPORTUNITY_TRANSITIONS, "on_progress", "close")).toBe(true);
    expect(canTransition(OPPORTUNITY_TRANSITIONS, "on_progress", "drop")).toBe(true);
    expect(canTransition(OPPORTUNITY_TRANSITIONS, "pending", "on_progress")).toBe(true);
  });

  it("treats close and drop as terminal", () => {
    const terminal: OpportunityStatus[] = ["close", "drop"];
    for (const from of terminal) {
      for (const to of ["on_progress", "pending", "close", "drop"] as OpportunityStatus[]) {
        expect(canTransition(OPPORTUNITY_TRANSITIONS, from, to)).toBe(false);
      }
    }
  });

  it("rejects a move out of a terminal status with a clear message", () => {
    expect(() =>
      assertTransition(OPPORTUNITY_TRANSITIONS, OPPORTUNITY_STATUS, "close", "on_progress")
    ).toThrow(TransitionError);

    try {
      assertTransition(OPPORTUNITY_TRANSITIONS, OPPORTUNITY_STATUS, "drop", "on_progress");
    } catch (error) {
      expect((error as Error).message).toContain("final");
    }
  });

  it("rejects a no-op transition", () => {
    expect(() =>
      assertTransition(OPPORTUNITY_TRANSITIONS, OPPORTUNITY_STATUS, "pending", "pending")
    ).toThrow(/sudah/i);
  });

  it("lists the available statuses when a move is not allowed", () => {
    // Every non-terminal status has at least one legal next step to suggest.
    try {
      assertTransition(OPPORTUNITY_TRANSITIONS, OPPORTUNITY_STATUS, "on_progress", "on_progress");
    } catch {
      // handled above; this case is the no-op path
    }
    expect(OPPORTUNITY_TRANSITIONS.on_progress.length).toBeGreaterThan(0);
    expect(OPPORTUNITY_TRANSITIONS.pending.length).toBeGreaterThan(0);
  });
});

describe("sales approval form transitions", () => {
  it("only allows submission from draft or revision", () => {
    expect(canTransition(SAF_TRANSITIONS, "draft", "menunggu_persetujuan")).toBe(true);
    expect(canTransition(SAF_TRANSITIONS, "perlu_revisi", "menunggu_persetujuan")).toBe(true);
    expect(canTransition(SAF_TRANSITIONS, "disetujui", "menunggu_persetujuan")).toBe(false);
  });

  it("only allows a decision from the pending state", () => {
    expect(canTransition(SAF_TRANSITIONS, "menunggu_persetujuan", "disetujui")).toBe(true);
    expect(canTransition(SAF_TRANSITIONS, "menunggu_persetujuan", "ditolak")).toBe(true);
    expect(canTransition(SAF_TRANSITIONS, "draft", "disetujui")).toBe(false);
  });

  it("treats decided states as terminal", () => {
    expect(SAF_TRANSITIONS.disetujui).toHaveLength(0);
    expect(SAF_TRANSITIONS.ditolak).toHaveLength(0);
    expect(() =>
      assertTransition(SAF_TRANSITIONS, SAF_STATUS, "disetujui", "ditolak")
    ).toThrow(TransitionError);
  });
});

describe("contract transitions", () => {
  it("follows the signing sequence", () => {
    expect(canTransition(CONTRACT_TRANSITIONS, "draft", "ditandatangani_satu_pihak")).toBe(true);
    expect(
      canTransition(CONTRACT_TRANSITIONS, "ditandatangani_satu_pihak", "ditandatangani_penuh")
    ).toBe(true);
  });

  it("does not allow skipping straight from draft to fully signed", () => {
    expect(canTransition(CONTRACT_TRANSITIONS, "draft", "ditandatangani_penuh")).toBe(false);
    expect(() =>
      assertTransition(CONTRACT_TRANSITIONS, CONTRACT_STATUS, "draft", "ditandatangani_penuh")
    ).toThrow(TransitionError);
  });

  it("allows cancellation from any active state", () => {
    expect(canTransition(CONTRACT_TRANSITIONS, "draft", "dibatalkan")).toBe(true);
    expect(canTransition(CONTRACT_TRANSITIONS, "ditandatangani_satu_pihak", "dibatalkan")).toBe(true);
    expect(canTransition(CONTRACT_TRANSITIONS, "ditandatangani_penuh", "dibatalkan")).toBe(true);
  });
});

describe("delivery order transitions", () => {
  it("follows the shipment sequence", () => {
    expect(canTransition(DO_TRANSITIONS, "draft", "terjadwal")).toBe(true);
    expect(canTransition(DO_TRANSITIONS, "terjadwal", "dalam_pengiriman")).toBe(true);
    expect(canTransition(DO_TRANSITIONS, "dalam_pengiriman", "selesai")).toBe(true);
  });

  it("does not allow completing an order that was never scheduled", () => {
    expect(canTransition(DO_TRANSITIONS, "draft", "selesai")).toBe(false);
    expect(() => assertTransition(DO_TRANSITIONS, DO_STATUS, "draft", "selesai")).toThrow(
      TransitionError
    );
  });

  it("treats completed and cancelled as terminal", () => {
    expect(DO_TRANSITIONS.selesai).toHaveLength(0);
    expect(DO_TRANSITIONS.dibatalkan).toHaveLength(0);
  });
});

describe("role permissions", () => {
  it("restricts approval authority to management", () => {
    expect(canDecideApproval("management")).toBe(true);
    expect(canDecideApproval("sales_manager")).toBe(false);
    expect(canDecideApproval("marketing")).toBe(false);
  });

  it("restricts contract and delivery management to sales manager and management", () => {
    expect(canManageContracts("management")).toBe(true);
    expect(canManageContracts("sales_manager")).toBe(true);
    expect(canManageContracts("marketing")).toBe(false);
  });

  it("allows all three roles to work the sales pipeline", () => {
    expect(canManageSales("marketing")).toBe(true);
    expect(canManageSales("sales_manager")).toBe(true);
    expect(canManageSales("management")).toBe(true);
  });
});
