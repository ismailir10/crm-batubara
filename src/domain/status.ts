import type {
  ContractStatus,
  DoStatus,
  OpportunityStatus,
  ProspectStatus,
  SafStatus,
  UserRole,
} from "./types";

/**
 * Status models and their legal transitions (specification §10).
 *
 * Transitions are validated server-side against these maps. An illegal
 * transition is rejected with a message rather than silently ignored.
 */

export type Tone = "neutral" | "info" | "warning" | "success" | "danger";

export interface StatusMeta<T extends string> {
  value: T;
  label: string;
  tone: Tone;
  description?: string;
}

// --- Prospect ---------------------------------------------------------------

export const PROSPECT_STATUS: Record<ProspectStatus, StatusMeta<ProspectStatus>> = {
  baru: { value: "baru", label: "Baru", tone: "info" },
  terkualifikasi: { value: "terkualifikasi", label: "Terkualifikasi", tone: "success" },
  tidak_memenuhi_syarat: {
    value: "tidak_memenuhi_syarat",
    label: "Tidak Memenuhi Syarat",
    tone: "danger",
  },
  tidak_aktif: { value: "tidak_aktif", label: "Tidak Aktif", tone: "neutral" },
};

// --- Opportunity ------------------------------------------------------------
// "Close" means the deal was won; "Drop" covers the lost case (decision D-016).

export const OPPORTUNITY_STATUS: Record<OpportunityStatus, StatusMeta<OpportunityStatus>> = {
  on_progress: {
    value: "on_progress",
    label: "On Progress",
    tone: "info",
    description: "Sedang aktif ditindaklanjuti",
  },
  pending: {
    value: "pending",
    label: "Pending",
    tone: "warning",
    description: "Menunggu tindak lanjut atau keputusan buyer",
  },
  close: {
    value: "close",
    label: "Close (Deal)",
    tone: "success",
    description: "Deal tercapai dan dilanjutkan ke kontrak",
  },
  drop: {
    value: "drop",
    label: "Drop",
    tone: "danger",
    description: "Tidak dilanjutkan",
  },
};

export const OPPORTUNITY_TRANSITIONS: Record<OpportunityStatus, OpportunityStatus[]> = {
  on_progress: ["pending", "close", "drop"],
  pending: ["on_progress", "close", "drop"],
  close: [],
  drop: [],
};

// --- Sales Approval Form ----------------------------------------------------

export const SAF_STATUS: Record<SafStatus, StatusMeta<SafStatus>> = {
  draft: { value: "draft", label: "Draft", tone: "neutral" },
  menunggu_persetujuan: {
    value: "menunggu_persetujuan",
    label: "Menunggu Persetujuan",
    tone: "warning",
  },
  disetujui: { value: "disetujui", label: "Disetujui", tone: "success" },
  ditolak: { value: "ditolak", label: "Ditolak", tone: "danger" },
  perlu_revisi: { value: "perlu_revisi", label: "Perlu Revisi", tone: "info" },
};

export const SAF_TRANSITIONS: Record<SafStatus, SafStatus[]> = {
  draft: ["menunggu_persetujuan"],
  menunggu_persetujuan: ["disetujui", "ditolak", "perlu_revisi"],
  perlu_revisi: ["draft", "menunggu_persetujuan"],
  disetujui: [],
  ditolak: [],
};

/** Only management may move a form into a decided state (also enforced by RLS). */
export const SAF_DECISION_STATUSES: SafStatus[] = ["disetujui", "ditolak"];

// --- Contract ---------------------------------------------------------------

export const CONTRACT_STATUS: Record<ContractStatus, StatusMeta<ContractStatus>> = {
  draft: { value: "draft", label: "Draft", tone: "neutral" },
  ditandatangani_satu_pihak: {
    value: "ditandatangani_satu_pihak",
    label: "Ditandatangani Satu Pihak",
    tone: "warning",
  },
  ditandatangani_penuh: {
    value: "ditandatangani_penuh",
    label: "Ditandatangani Penuh",
    tone: "success",
  },
  selesai: { value: "selesai", label: "Selesai", tone: "info" },
  dibatalkan: { value: "dibatalkan", label: "Dibatalkan", tone: "danger" },
};

export const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ["ditandatangani_satu_pihak", "dibatalkan"],
  ditandatangani_satu_pihak: ["ditandatangani_penuh", "dibatalkan"],
  ditandatangani_penuh: ["selesai", "dibatalkan"],
  selesai: [],
  dibatalkan: [],
};

// --- Delivery Order ---------------------------------------------------------

export const DO_STATUS: Record<DoStatus, StatusMeta<DoStatus>> = {
  draft: { value: "draft", label: "Draft", tone: "neutral" },
  terjadwal: { value: "terjadwal", label: "Terjadwal", tone: "info" },
  dalam_pengiriman: { value: "dalam_pengiriman", label: "Dalam Pengiriman", tone: "warning" },
  selesai: { value: "selesai", label: "Selesai", tone: "success" },
  dibatalkan: { value: "dibatalkan", label: "Dibatalkan", tone: "danger" },
};

export const DO_TRANSITIONS: Record<DoStatus, DoStatus[]> = {
  draft: ["terjadwal", "dibatalkan"],
  terjadwal: ["dalam_pengiriman", "dibatalkan"],
  dalam_pengiriman: ["selesai", "dibatalkan"],
  selesai: [],
  dibatalkan: [],
};

// --- Generic helpers --------------------------------------------------------

export function canTransition<T extends string>(
  map: Record<T, T[]>,
  from: T,
  to: T
): boolean {
  return map[from]?.includes(to) ?? false;
}

export function assertTransition<T extends string>(
  map: Record<T, T[]>,
  labels: Record<T, StatusMeta<T>>,
  from: T,
  to: T
): void {
  if (from === to) {
    throw new TransitionError(`Status sudah "${labels[to].label}".`);
  }
  if (!canTransition(map, from, to)) {
    const allowed = map[from] ?? [];
    throw new TransitionError(
      allowed.length === 0
        ? `Status "${labels[from].label}" bersifat final dan tidak dapat diubah.`
        : `Perubahan dari "${labels[from].label}" ke "${labels[to].label}" tidak diizinkan. ` +
          `Status yang tersedia: ${allowed.map((a) => labels[a].label).join(", ")}.`
    );
  }
}

export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransitionError";
  }
}

export const ROLE_LABEL: Record<UserRole, string> = {
  marketing: "Marketing",
  sales_manager: "Sales Manager",
  management: "Manajemen",
};

/** Only management decides an approval form. Mirrors the RLS policy. */
export function canDecideApproval(role: UserRole): boolean {
  return role === "management";
}

/** Contracts, delivery stages and delivery orders. */
export function canManageContracts(role: UserRole): boolean {
  return role === "sales_manager" || role === "management";
}

/** Prospects, opportunities, meeting notes, drafting an approval form. */
export function canManageSales(role: UserRole): boolean {
  return role === "marketing" || role === "sales_manager" || role === "management";
}
