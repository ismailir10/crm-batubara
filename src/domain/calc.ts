import type { DeliveryOrder, DeliveryStage, DoStatus } from "./types";

/**
 * Delivery arithmetic (specification §9.6, §9.7).
 *
 * Two distinct quantities, easily confused, deliberately named apart:
 *  - allocated: planned tonnage on delivery orders that still count (not cancelled)
 *  - delivered: actual tonnage on delivery orders that reached "selesai"
 */

/** Delivery orders that still consume a stage's planned volume. */
const ACTIVE_DO_STATUSES: DoStatus[] = ["draft", "terjadwal", "dalam_pengiriman", "selesai"];

export function isActiveDo(status: DoStatus): boolean {
  return ACTIVE_DO_STATUSES.includes(status);
}

export function allocatedTonnes(orders: Pick<DeliveryOrder, "status" | "plannedVolumeTonnes">[]) {
  return round2(
    orders
      .filter((o) => isActiveDo(o.status))
      .reduce((sum, o) => sum + o.plannedVolumeTonnes, 0)
  );
}

export function deliveredTonnes(
  orders: Pick<DeliveryOrder, "status" | "actualVolumeTonnes">[]
) {
  return round2(
    orders
      .filter((o) => o.status === "selesai")
      .reduce((sum, o) => sum + (o.actualVolumeTonnes ?? 0), 0)
  );
}

export interface ProgressSummary {
  planned: number;
  delivered: number;
  remaining: number;
  percent: number;
}

export function progress(planned: number, delivered: number): ProgressSummary {
  const safePlanned = planned > 0 ? planned : 0;
  return {
    planned: round2(safePlanned),
    delivered: round2(delivered),
    remaining: round2(Math.max(safePlanned - delivered, 0)),
    percent: safePlanned === 0 ? 0 : round2((delivered / safePlanned) * 100),
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Stage volumes must sum to the contract total. Contract volume is what was
 * agreed; stages that do not add up mean someone will over- or under-ship.
 */
export function assertStagesMatchContract(
  totalVolumeTonnes: number,
  stages: { plannedVolumeTonnes: number }[]
): void {
  if (stages.length === 0) {
    throw new ValidationError("Kontrak harus memiliki minimal satu tahap pengiriman.");
  }
  const sum = round2(stages.reduce((s, st) => s + st.plannedVolumeTonnes, 0));
  const total = round2(totalVolumeTonnes);
  if (Math.abs(sum - total) > 0.01) {
    const diff = round2(sum - total);
    throw new ValidationError(
      `Total volume tahap pengiriman (${formatTonnes(sum)}) tidak sama dengan volume kontrak ` +
        `(${formatTonnes(total)}). Selisih ${diff > 0 ? "+" : ""}${formatTonnes(diff)}.`
    );
  }
}

/**
 * A stage cannot be over-allocated. This is the mistake the Delivery Order
 * module exists to prevent, so it fails loudly with the numbers involved.
 */
export function assertStageCapacity(
  stage: Pick<DeliveryStage, "stageNo" | "plannedVolumeTonnes">,
  alreadyAllocated: number,
  requestedTonnes: number
): void {
  if (requestedTonnes <= 0) {
    throw new ValidationError("Volume DO harus lebih besar dari nol.");
  }
  const remaining = round2(stage.plannedVolumeTonnes - alreadyAllocated);
  if (requestedTonnes > remaining + 0.01) {
    throw new ValidationError(
      `Volume DO (${formatTonnes(requestedTonnes)}) melebihi sisa kuota Tahap ${stage.stageNo}. ` +
        `Rencana tahap ${formatTonnes(stage.plannedVolumeTonnes)}, sudah dialokasikan ` +
        `${formatTonnes(alreadyAllocated)}, sisa ${formatTonnes(remaining)}.`
    );
  }
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatTonnes(value: number): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value)} MT`;
}
