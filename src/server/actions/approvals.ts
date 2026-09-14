"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ForbiddenError, query, requireUser } from "@/lib/session";
import { safDecisionSchema, salesApprovalFormSchema } from "@/domain/schemas";
import {
  SAF_STATUS,
  SAF_TRANSITIONS,
  assertTransition,
  canDecideApproval,
  canManageSales,
} from "@/domain/status";
import type { SafStatus } from "@/domain/types";
import { failure, field, success, toActionState, type ActionState } from "../action-state";

/**
 * Creates a Sales Approval Form and freezes the market reference onto it.
 *
 * The frozen price is the design choice that ties Coal Price Intelligence to the
 * commercial workflow (specification §9.5): management approves a price against
 * the index as it stood on the day of submission, not as it stands when they
 * happen to open the form.
 */
export async function createApprovalFormAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  let newId: string | null = null;

  try {
    const user = await requireUser();
    if (!canManageSales(user.role)) {
      throw new ForbiddenError("Peran Anda tidak memiliki akses untuk membuat form persetujuan.");
    }

    const submitNow = field(formData, "submitNow") === "yes";
    const input = salesApprovalFormSchema.parse({
      opportunityId: field(formData, "opportunityId"),
      proposedVolumeTonnes: field(formData, "proposedVolumeTonnes"),
      proposedPriceUsdPerTonne: field(formData, "proposedPriceUsdPerTonne"),
      paymentTerm: field(formData, "paymentTerm"),
      deliveryTerm: field(formData, "deliveryTerm"),
      contractPeriodStart: field(formData, "contractPeriodStart"),
      contractPeriodEnd: field(formData, "contractPeriodEnd"),
      justification: field(formData, "justification"),
      refSourceCode: field(formData, "refSourceCode"),
    });

    newId = await query(async (client) => {
      let reference: {
        code: string;
        name: string;
        price: number;
        observation_date: string;
      } | null = null;

      if (input.refSourceCode) {
        const result = await client.query<{
          code: string;
          name: string;
          price: number;
          observation_date: string;
        }>(
          `select s.code, s.name, o.price, o.observation_date
           from coal_price_observations o
           join coal_price_sources s on s.id = o.source_id
           where s.code = $1
           order by o.observation_date desc
           limit 1`,
          [input.refSourceCode]
        );
        reference = result.rows[0] ?? null;
      }

      const inserted = await client.query<{ id: string }>(
        `insert into sales_approval_forms
           (opportunity_id, proposed_volume_tonnes, proposed_price_usd_per_tonne, payment_term,
            delivery_term, contract_period_start, contract_period_end, justification,
            ref_source_code, ref_source_name, ref_price_usd_per_tonne, ref_observation_date,
            status, submitted_by, submitted_at, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         returning id`,
        [
          input.opportunityId,
          input.proposedVolumeTonnes,
          input.proposedPriceUsdPerTonne,
          input.paymentTerm,
          input.deliveryTerm,
          input.contractPeriodStart,
          input.contractPeriodEnd,
          input.justification,
          reference?.code ?? null,
          reference?.name ?? null,
          reference?.price ?? null,
          reference?.observation_date ?? null,
          submitNow ? "menunggu_persetujuan" : "draft",
          submitNow ? user.id : null,
          submitNow ? new Date().toISOString() : null,
          user.id,
        ]
      );
      return inserted.rows[0].id;
    });

    revalidatePath("/persetujuan");
    revalidatePath("/");
  } catch (error) {
    return toActionState(error);
  }

  redirect(`/persetujuan/${newId}`);
}

export async function submitApprovalFormAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    if (!canManageSales(user.role)) {
      throw new ForbiddenError("Peran Anda tidak memiliki akses untuk mengajukan form ini.");
    }

    const id = field(formData, "safId");
    if (!id) return failure("Form tidak ditemukan.");

    await query(async (client) => {
      const current = await client.query<{ status: SafStatus }>(
        `select status from sales_approval_forms where id = $1 for update`,
        [id]
      );
      const from = current.rows[0]?.status;
      if (!from) throw new Error("Form tidak ditemukan.");

      assertTransition(SAF_TRANSITIONS, SAF_STATUS, from, "menunggu_persetujuan");

      await client.query(
        `update sales_approval_forms
           set status = 'menunggu_persetujuan', submitted_by = $2, submitted_at = now()
         where id = $1`,
        [id, user.id]
      );
    });

    revalidatePath(`/persetujuan/${id}`);
    revalidatePath("/persetujuan");
    revalidatePath("/");
    return success("Form diajukan ke manajemen untuk persetujuan.");
  } catch (error) {
    return toActionState(error);
  }
}

/**
 * The approval gate. Guarded here and, independently, by the RLS policy on
 * sales_approval_forms — so a crafted request that bypasses this code still
 * fails at the database (specification §9.5, AC-09).
 */
export async function decideApprovalFormAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    if (!canDecideApproval(user.role)) {
      throw new ForbiddenError(
        "Hanya Manajemen yang dapat menyetujui atau menolak Sales Approval Form."
      );
    }

    const input = safDecisionSchema.parse({
      safId: field(formData, "safId"),
      decision: field(formData, "decision"),
      decisionNote: field(formData, "decisionNote"),
    });

    await query(async (client) => {
      const current = await client.query<{ status: SafStatus; opportunity_id: string }>(
        `select status, opportunity_id from sales_approval_forms where id = $1 for update`,
        [input.safId]
      );
      const row = current.rows[0];
      if (!row) throw new Error("Form tidak ditemukan.");

      assertTransition(SAF_TRANSITIONS, SAF_STATUS, row.status, input.decision);

      await client.query(
        `update sales_approval_forms
           set status = $2, decided_by = $3, decided_at = now(), decision_note = $4
         where id = $1`,
        [input.safId, input.decision, user.id, input.decisionNote]
      );

      // A rejection sends the opportunity back to Pending with the reason
      // visible on its timeline, so the refusal is never a dead end.
      if (input.decision === "ditolak") {
        const opportunity = await client.query<{ status: string }>(
          `select status from opportunities where id = $1 for update`,
          [row.opportunity_id]
        );
        if (opportunity.rows[0]?.status === "on_progress") {
          await client.query(`update opportunities set status = 'pending' where id = $1`, [
            row.opportunity_id,
          ]);
          await client.query(
            `insert into opportunity_status_history
               (opportunity_id, from_status, to_status, reason, changed_by)
             values ($1,'on_progress','pending',$2,$3)`,
            [
              row.opportunity_id,
              `Sales Approval Form ditolak: ${input.decisionNote}`,
              user.id,
            ]
          );
        }
      }
    });

    revalidatePath(`/persetujuan/${input.safId}`);
    revalidatePath("/persetujuan");
    revalidatePath("/opportunity");
    revalidatePath("/");

    return success(
      input.decision === "disetujui"
        ? "Form disetujui. Kontrak sudah dapat dibuat dari opportunity ini."
        : input.decision === "ditolak"
          ? "Form ditolak dan opportunity dikembalikan ke status Pending."
          : "Form dikembalikan untuk revisi."
    );
  } catch (error) {
    return toActionState(error);
  }
}
