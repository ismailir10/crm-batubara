import { z } from "zod";

/**
 * Input validation at the server boundary (specification §15).
 * Messages are user-facing Bahasa Indonesia.
 */

const requiredText = (label: string, max = 500) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

const isoDate = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} harus berformat tanggal yang valid.`);

const optionalIsoDate = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Tanggal tidak valid.");

const positiveNumber = (label: string) =>
  z.coerce
    .number({ message: `${label} harus berupa angka.` })
    .positive(`${label} harus lebih besar dari nol.`);

const optionalNumber = (label: string) =>
  z
    .union([z.literal(""), z.coerce.number({ message: `${label} harus berupa angka.` })])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : (v as number)));

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const prospectSchema = z.object({
  companyName: requiredText("Nama perusahaan", 200),
  country: requiredText("Negara", 100),
  city: optionalText(100),
  contactPerson: optionalText(150),
  contactRole: optionalText(150),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .refine((v) => v === null || z.string().email().safeParse(v).success, "Format email tidak valid."),
  contactPhone: optionalText(50),
  source: optionalText(100),
  status: z.enum(["baru", "terkualifikasi", "tidak_memenuhi_syarat", "tidak_aktif"]),
  notes: optionalText(2000),
});

export const meetingNoteSchema = z.object({
  prospectId: z.string().uuid("Prospek tidak valid."),
  opportunityId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  meetingDate: isoDate("Tanggal meeting"),
  location: optionalText(200),
  attendees: requiredText("Peserta", 500),
  summary: requiredText("Ringkasan diskusi", 4000),
  nextAction: optionalText(1000),
  nextActionDate: optionalIsoDate(),
});

export const opportunitySchema = z.object({
  prospectId: z.string().uuid("Prospek wajib dipilih."),
  title: requiredText("Judul opportunity", 200),
  coalGarKcal: optionalNumber("GAR"),
  coalTmPct: optionalNumber("Total Moisture"),
  coalAshPct: optionalNumber("Ash"),
  coalSulphurPct: optionalNumber("Sulphur"),
  estimatedVolumeTonnes: positiveNumber("Estimasi volume"),
  estimatedPriceUsdPerTonne: positiveNumber("Estimasi harga"),
  deliveryTerm: requiredText("Delivery term", 100),
  expectedCloseDate: optionalIsoDate(),
});

export const opportunityStatusSchema = z.object({
  opportunityId: z.string().uuid(),
  status: z.enum(["on_progress", "pending", "close", "drop"]),
  reason: requiredText("Alasan perubahan status", 1000),
});

export const salesApprovalFormSchema = z.object({
  opportunityId: z.string().uuid("Opportunity wajib dipilih."),
  proposedVolumeTonnes: positiveNumber("Volume yang diajukan"),
  proposedPriceUsdPerTonne: positiveNumber("Harga yang diajukan"),
  paymentTerm: requiredText("Term pembayaran", 200),
  deliveryTerm: requiredText("Delivery term", 100),
  contractPeriodStart: optionalIsoDate(),
  contractPeriodEnd: optionalIsoDate(),
  justification: requiredText("Justifikasi", 4000),
  refSourceCode: optionalText(50),
});

export const safDecisionSchema = z.object({
  safId: z.string().uuid(),
  decision: z.enum(["disetujui", "ditolak", "perlu_revisi"]),
  decisionNote: requiredText("Catatan keputusan", 2000),
});

export const deliveryStageInputSchema = z.object({
  stageNo: z.coerce.number().int().positive(),
  plannedVolumeTonnes: positiveNumber("Volume tahap"),
  periodStart: isoDate("Periode mulai"),
  periodEnd: isoDate("Periode selesai"),
  notes: optionalText(500),
});

export const contractSchema = z
  .object({
    salesApprovalFormId: z.string().uuid("Sales Approval Form wajib dipilih."),
    title: requiredText("Judul kontrak", 200),
    totalVolumeTonnes: positiveNumber("Total volume"),
    priceUsdPerTonne: positiveNumber("Harga"),
    priceBasis: requiredText("Dasar harga", 100),
    periodStart: isoDate("Periode mulai"),
    periodEnd: isoDate("Periode selesai"),
    stages: z.array(deliveryStageInputSchema).min(1, "Minimal satu tahap pengiriman."),
  })
  .refine((v) => v.periodEnd >= v.periodStart, {
    message: "Periode selesai tidak boleh lebih awal dari periode mulai.",
    path: ["periodEnd"],
  });

export const contractStatusSchema = z.object({
  contractId: z.string().uuid(),
  status: z.enum([
    "draft",
    "ditandatangani_satu_pihak",
    "ditandatangani_penuh",
    "selesai",
    "dibatalkan",
  ]),
  signatureDate: optionalIsoDate(),
});

export const deliveryOrderSchema = z
  .object({
    contractId: z.string().uuid("Kontrak wajib dipilih."),
    stageId: z.string().uuid("Tahap pengiriman wajib dipilih."),
    plannedVolumeTonnes: positiveNumber("Volume rencana"),
    laycanStart: optionalIsoDate(),
    laycanEnd: optionalIsoDate(),
    loadingPoint: optionalText(200),
    destination: optionalText(200),
    vesselName: optionalText(200),
  })
  .refine((v) => !v.laycanStart || !v.laycanEnd || v.laycanEnd >= v.laycanStart, {
    message: "Laycan selesai tidak boleh lebih awal dari laycan mulai.",
    path: ["laycanEnd"],
  });

export const deliveryOrderStatusSchema = z.object({
  deliveryOrderId: z.string().uuid(),
  status: z.enum(["draft", "terjadwal", "dalam_pengiriman", "selesai", "dibatalkan"]),
  actualVolumeTonnes: optionalNumber("Volume aktual"),
});

export const priceRangeSchema = z.object({
  from: isoDate("Tanggal mulai"),
  to: isoDate("Tanggal akhir"),
  sourceCodes: z.array(z.string()).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProspectInput = z.infer<typeof prospectSchema>;
export type MeetingNoteInput = z.infer<typeof meetingNoteSchema>;
export type OpportunityInput = z.infer<typeof opportunitySchema>;
export type SalesApprovalFormInput = z.infer<typeof salesApprovalFormSchema>;
export type ContractInput = z.infer<typeof contractSchema>;
export type DeliveryOrderInput = z.infer<typeof deliveryOrderSchema>;
