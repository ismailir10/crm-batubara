export type UserRole = "marketing" | "sales_manager" | "management";

export type ProspectStatus =
  | "baru"
  | "terkualifikasi"
  | "tidak_memenuhi_syarat"
  | "tidak_aktif";

export type OpportunityStatus = "on_progress" | "pending" | "close" | "drop";

export type SafStatus =
  | "draft"
  | "menunggu_persetujuan"
  | "disetujui"
  | "ditolak"
  | "perlu_revisi";

export type ContractStatus =
  | "draft"
  | "ditandatangani_satu_pihak"
  | "ditandatangani_penuh"
  | "selesai"
  | "dibatalkan";

export type DoStatus =
  | "draft"
  | "terjadwal"
  | "dalam_pengiriman"
  | "selesai"
  | "dibatalkan";

export type IngestionStatus = "berhasil" | "gagal" | "sebagian";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  role: UserRole;
}

export interface Prospect {
  id: string;
  code: string;
  companyName: string;
  country: string;
  city: string | null;
  contactPerson: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string | null;
  status: ProspectStatus;
  ownerId: string;
  ownerName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  code: string;
  prospectId: string;
  prospectName: string;
  title: string;
  coalGarKcal: number | null;
  coalTmPct: number | null;
  coalAshPct: number | null;
  coalSulphurPct: number | null;
  estimatedVolumeTonnes: number;
  estimatedPriceUsdPerTonne: number;
  estimatedValueUsd: number;
  deliveryTerm: string;
  expectedCloseDate: string | null;
  status: OpportunityStatus;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityStatusHistoryEntry {
  id: string;
  fromStatus: OpportunityStatus | null;
  toStatus: OpportunityStatus;
  reason: string;
  changedByName: string;
  changedAt: string;
}

export interface MeetingNote {
  id: string;
  prospectId: string;
  prospectName: string;
  opportunityId: string | null;
  opportunityCode: string | null;
  meetingDate: string;
  location: string | null;
  attendees: string;
  summary: string;
  nextAction: string | null;
  nextActionDate: string | null;
  createdByName: string;
  createdAt: string;
}

export interface SalesApprovalForm {
  id: string;
  code: string;
  opportunityId: string;
  opportunityCode: string;
  opportunityTitle: string;
  prospectName: string;
  proposedVolumeTonnes: number;
  proposedPriceUsdPerTonne: number;
  proposedValueUsd: number;
  paymentTerm: string;
  deliveryTerm: string;
  contractPeriodStart: string | null;
  contractPeriodEnd: string | null;
  justification: string;
  refSourceCode: string | null;
  refSourceName: string | null;
  refPriceUsdPerTonne: number | null;
  refObservationDate: string | null;
  status: SafStatus;
  submittedByName: string | null;
  submittedAt: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  contractId: string | null;
}

export interface DeliveryStage {
  id: string;
  contractId: string;
  stageNo: number;
  plannedVolumeTonnes: number;
  periodStart: string;
  periodEnd: string;
  notes: string | null;
  deliveredTonnes: number;
  allocatedTonnes: number;
}

export interface Contract {
  id: string;
  contractNumber: string;
  opportunityId: string;
  opportunityCode: string;
  salesApprovalFormId: string;
  salesApprovalFormCode: string;
  prospectId: string;
  prospectName: string;
  title: string;
  totalVolumeTonnes: number;
  priceUsdPerTonne: number;
  priceBasis: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  status: ContractStatus;
  signedBySellerAt: string | null;
  signedByBuyerAt: string | null;
  createdAt: string;
  deliveredTonnes: number;
}

export interface DeliveryOrder {
  id: string;
  doNumber: string;
  contractId: string;
  contractNumber: string;
  prospectName: string;
  stageId: string;
  stageNo: number;
  plannedVolumeTonnes: number;
  actualVolumeTonnes: number | null;
  laycanStart: string | null;
  laycanEnd: string | null;
  loadingPoint: string | null;
  destination: string | null;
  vesselName: string | null;
  status: DoStatus;
  createdAt: string;
}

export interface PriceSource {
  id: string;
  code: string;
  name: string;
  provider: string;
  region: string;
  specLabel: string | null;
  unit: string;
  currency: string;
  isMock: boolean;
  sortOrder: number;
}

export interface PriceObservation {
  id: string;
  sourceId: string;
  sourceCode: string;
  sourceName: string;
  provider: string;
  region: string;
  observationDate: string;
  price: number;
  unit: string;
  currency: string;
  fetchedAt: string;
  ingestionRunId: string | null;
}

export interface IngestionRun {
  id: string;
  sourceId: string;
  sourceCode: string;
  sourceName: string;
  adapterName: string;
  startedAt: string;
  finishedAt: string | null;
  status: IngestionStatus;
  rowsIngested: number;
  message: string | null;
}
