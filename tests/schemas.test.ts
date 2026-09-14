import { describe, expect, it } from "vitest";
import {
  contractSchema,
  deliveryOrderSchema,
  loginSchema,
  opportunitySchema,
  safDecisionSchema,
  salesApprovalFormSchema,
} from "@/domain/schemas";

describe("loginSchema", () => {
  it("accepts a valid credential pair", () => {
    const result = loginSchema.safeParse({
      email: "dewi.anggraini@demo-batubara.co.id",
      password: "demo1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({ email: "bukan-email", password: "demo1234" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("opportunitySchema", () => {
  const valid = {
    prospectId: "3f1c2a5e-7d4b-4c2a-9f8e-1a2b3c4d5e6f",
    title: "Pasokan GAR 4200",
    estimatedVolumeTonnes: "300000",
    estimatedPriceUsdPerTonne: "54.5",
    deliveryTerm: "FOB Vessel",
  };

  it("coerces numeric strings from form data", () => {
    const result = opportunitySchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estimatedVolumeTonnes).toBe(300000);
      expect(result.data.estimatedPriceUsdPerTonne).toBe(54.5);
    }
  });

  it("rejects a zero or negative volume", () => {
    expect(
      opportunitySchema.safeParse({ ...valid, estimatedVolumeTonnes: "0" }).success
    ).toBe(false);
    expect(
      opportunitySchema.safeParse({ ...valid, estimatedVolumeTonnes: "-5" }).success
    ).toBe(false);
  });

  it("rejects a non-numeric price", () => {
    expect(
      opportunitySchema.safeParse({ ...valid, estimatedPriceUsdPerTonne: "mahal" }).success
    ).toBe(false);
  });

  it("turns empty optional fields into null rather than empty strings", () => {
    const result = opportunitySchema.safeParse({ ...valid, coalGarKcal: "", expectedCloseDate: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coalGarKcal).toBeNull();
      expect(result.data.expectedCloseDate).toBeNull();
    }
  });

  it("requires a prospect", () => {
    expect(opportunitySchema.safeParse({ ...valid, prospectId: "" }).success).toBe(false);
  });
});

describe("salesApprovalFormSchema", () => {
  const valid = {
    opportunityId: "3f1c2a5e-7d4b-4c2a-9f8e-1a2b3c4d5e6f",
    proposedVolumeTonnes: "300000",
    proposedPriceUsdPerTonne: "54.5",
    paymentTerm: "LC at sight",
    deliveryTerm: "FOB Vessel",
    justification: "Buyer reguler dengan riwayat pembayaran baik.",
  };

  it("accepts a complete submission", () => {
    expect(salesApprovalFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a justification", () => {
    expect(salesApprovalFormSchema.safeParse({ ...valid, justification: "" }).success).toBe(false);
  });

  it("requires a positive price", () => {
    expect(
      salesApprovalFormSchema.safeParse({ ...valid, proposedPriceUsdPerTonne: "0" }).success
    ).toBe(false);
  });
});

describe("safDecisionSchema", () => {
  const safId = "3f1c2a5e-7d4b-4c2a-9f8e-1a2b3c4d5e6f";

  it("accepts the three decision outcomes", () => {
    for (const decision of ["disetujui", "ditolak", "perlu_revisi"]) {
      expect(
        safDecisionSchema.safeParse({ safId, decision, decisionNote: "Catatan." }).success
      ).toBe(true);
    }
  });

  it("rejects an unknown decision", () => {
    expect(
      safDecisionSchema.safeParse({ safId, decision: "mungkin", decisionNote: "x" }).success
    ).toBe(false);
  });

  it("requires a decision note", () => {
    // A decision without a reason is not auditable.
    expect(
      safDecisionSchema.safeParse({ safId, decision: "ditolak", decisionNote: "" }).success
    ).toBe(false);
  });
});

describe("contractSchema", () => {
  const valid = {
    salesApprovalFormId: "3f1c2a5e-7d4b-4c2a-9f8e-1a2b3c4d5e6f",
    title: "Kontrak Payung",
    totalVolumeTonnes: "300000",
    priceUsdPerTonne: "54.5",
    priceBasis: "Harga tetap",
    periodStart: "2026-09-01",
    periodEnd: "2027-08-31",
    stages: [
      {
        stageNo: 1,
        plannedVolumeTonnes: 300000,
        periodStart: "2026-09-01",
        periodEnd: "2027-08-31",
      },
    ],
  };

  it("accepts a contract with at least one stage", () => {
    expect(contractSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a contract with no stages", () => {
    expect(contractSchema.safeParse({ ...valid, stages: [] }).success).toBe(false);
  });

  it("rejects an end date earlier than the start date", () => {
    const result = contractSchema.safeParse({
      ...valid,
      periodStart: "2027-01-01",
      periodEnd: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("deliveryOrderSchema", () => {
  const valid = {
    contractId: "3f1c2a5e-7d4b-4c2a-9f8e-1a2b3c4d5e6f",
    stageId: "4f1c2a5e-7d4b-4c2a-9f8e-1a2b3c4d5e6f",
    plannedVolumeTonnes: "25000",
    laycanStart: "2026-09-10",
    laycanEnd: "2026-09-14",
  };

  it("accepts a valid delivery order", () => {
    expect(deliveryOrderSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a laycan that ends before it starts", () => {
    const result = deliveryOrderSchema.safeParse({
      ...valid,
      laycanStart: "2026-09-14",
      laycanEnd: "2026-09-10",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an order with no laycan dates at all", () => {
    const result = deliveryOrderSchema.safeParse({
      ...valid,
      laycanStart: "",
      laycanEnd: "",
    });
    expect(result.success).toBe(true);
  });
});
