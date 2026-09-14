"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ForbiddenError, query, requireUser } from "@/lib/session";
import { contractSchema, contractStatusSchema } from "@/domain/schemas";
import {
  CONTRACT_STATUS,
  CONTRACT_TRANSITIONS,
  assertTransition,
  canManageContracts,
} from "@/domain/status";
import { ValidationError, assertStagesMatchContract } from "@/domain/calc";
import type { ContractStatus } from "@/domain/types";
import { field, success, toActionState, type ActionState } from "../action-state";

interface StageInput {
  stageNo: number;
  plannedVolumeTonnes: number;
  periodStart: string;
  periodEnd: string;
  notes: string | null;
}

/** Stage rows arrive as parallel indexed form fields. */
function readStages(formData: FormData): StageInput[] {
  const volumes = formData.getAll("stageVolume");
  const starts = formData.getAll("stageStart");
  const ends = formData.getAll("stageEnd");
  const notes = formData.getAll("stageNotes");

  const stages: StageInput[] = [];
  for (let index = 0; index < volumes.length; index += 1) {
    const volume = String(volumes[index] ?? "").trim();
    const start = String(starts[index] ?? "").trim();
    const end = String(ends[index] ?? "").trim();
    if (!volume && !start && !end) continue;

    stages.push({
      stageNo: stages.length + 1,
      plannedVolumeTonnes: Number(volume),
      periodStart: start,
      periodEnd: end,
      notes: String(notes[index] ?? "").trim() || null,
    });
  }
  return stages;
}

export async function createContractAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  let newId: string | null = null;

  try {
    const user = await requireUser();
    if (!canManageContracts(user.role)) {
      throw new ForbiddenError("Hanya Sales Manager atau Manajemen yang dapat membuat kontrak.");
    }

    const stages = readStages(formData);
    const input = contractSchema.parse({
      salesApprovalFormId: field(formData, "salesApprovalFormId"),
      title: field(formData, "title"),
      totalVolumeTonnes: field(formData, "totalVolumeTonnes"),
      priceUsdPerTonne: field(formData, "priceUsdPerTonne"),
      priceBasis: field(formData, "priceBasis"),
      periodStart: field(formData, "periodStart"),
      periodEnd: field(formData, "periodEnd"),
      stages,
    });

    // Stage volumes that do not add up to the contract total mean someone will
    // over- or under-ship. Fail loudly with the numbers (specification §9.6).
    assertStagesMatchContract(input.totalVolumeTonnes, input.stages);

    for (const stage of input.stages) {
      if (stage.periodEnd < stage.periodStart) {
        throw new ValidationError(
          `Tahap ${stage.stageNo}: periode selesai tidak boleh lebih awal dari periode mulai.`
        );
      }
    }

    newId = await query(async (client) => {
      const saf = await client.query<{
        id: string;
        opportunity_id: string;
        prospect_id: string;
        status: string;
      }>(
        `select s.id, s.opportunity_id, o.prospect_id, s.status
         from sales_approval_forms s
         join opportunities o on o.id = s.opportunity_id
         where s.id = $1`,
        [input.salesApprovalFormId]
      );
      const row = saf.rows[0];
      if (!row) throw new ValidationError("Sales Approval Form tidak ditemukan.");
      if (row.status !== "disetujui") {
        throw new ValidationError(
          "Kontrak hanya dapat dibuat dari Sales Approval Form yang sudah disetujui."
        );
      }

      const existing = await client.query(
        `select 1 from contracts where sales_approval_form_id = $1`,
        [input.salesApprovalFormId]
      );
      if ((existing.rowCount ?? 0) > 0) {
        throw new ValidationError("Form persetujuan ini sudah memiliki kontrak.");
      }

      const contract = await client.query<{ id: string }>(
        `insert into contracts
           (opportunity_id, sales_approval_form_id, prospect_id, title, total_volume_tonnes,
            price_usd_per_tonne, price_basis, period_start, period_end, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [
          row.opportunity_id,
          row.id,
          row.prospect_id,
          input.title,
          input.totalVolumeTonnes,
          input.priceUsdPerTonne,
          input.priceBasis,
          input.periodStart,
          input.periodEnd,
          user.id,
        ]
      );
      const contractId = contract.rows[0].id;

      for (const stage of input.stages) {
        await client.query(
          `insert into contract_delivery_stages
             (contract_id, stage_no, planned_volume_tonnes, period_start, period_end, notes)
           values ($1,$2,$3,$4,$5,$6)`,
          [
            contractId,
            stage.stageNo,
            stage.plannedVolumeTonnes,
            stage.periodStart,
            stage.periodEnd,
            stage.notes,
          ]
        );
      }

      return contractId;
    });

    revalidatePath("/kontrak");
    revalidatePath("/");
  } catch (error) {
    return toActionState(error);
  }

  redirect(`/kontrak/${newId}`);
}

export async function changeContractStatusAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    if (!canManageContracts(user.role)) {
      throw new ForbiddenError(
        "Hanya Sales Manager atau Manajemen yang dapat mengubah status kontrak."
      );
    }

    const input = contractStatusSchema.parse({
      contractId: field(formData, "contractId"),
      status: field(formData, "status"),
      signatureDate: field(formData, "signatureDate"),
    });

    await query(async (client) => {
      const current = await client.query<{ status: ContractStatus }>(
        `select status from contracts where id = $1 for update`,
        [input.contractId]
      );
      const from = current.rows[0]?.status;
      if (!from) throw new ValidationError("Kontrak tidak ditemukan.");

      assertTransition(CONTRACT_TRANSITIONS, CONTRACT_STATUS, from, input.status);

      const signatureDate = input.signatureDate ?? new Date().toISOString().slice(0, 10);

      if (input.status === "ditandatangani_satu_pihak") {
        await client.query(
          `update contracts set status = $2, signed_by_seller_at = coalesce(signed_by_seller_at, $3)
           where id = $1`,
          [input.contractId, input.status, signatureDate]
        );
      } else if (input.status === "ditandatangani_penuh") {
        await client.query(
          `update contracts
             set status = $2,
                 signed_by_seller_at = coalesce(signed_by_seller_at, $3),
                 signed_by_buyer_at = coalesce(signed_by_buyer_at, $3)
           where id = $1`,
          [input.contractId, input.status, signatureDate]
        );
      } else {
        await client.query(`update contracts set status = $2 where id = $1`, [
          input.contractId,
          input.status,
        ]);
      }
    });

    revalidatePath(`/kontrak/${input.contractId}`);
    revalidatePath("/kontrak");
    revalidatePath("/");
    return success(`Status kontrak diubah menjadi "${CONTRACT_STATUS[input.status].label}".`);
  } catch (error) {
    return toActionState(error);
  }
}
