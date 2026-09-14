"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query, requireUser } from "@/lib/session";
import {
  meetingNoteSchema,
  opportunitySchema,
  opportunityStatusSchema,
  prospectSchema,
} from "@/domain/schemas";
import {
  OPPORTUNITY_STATUS,
  OPPORTUNITY_TRANSITIONS,
  assertTransition,
  canManageSales,
} from "@/domain/status";
import { ForbiddenError } from "@/lib/session";
import type { OpportunityStatus } from "@/domain/types";
import { failure, field, success, toActionState, type ActionState } from "../action-state";

function assertSalesAccess(role: Parameters<typeof canManageSales>[0]) {
  if (!canManageSales(role)) {
    throw new ForbiddenError("Peran Anda tidak memiliki akses untuk mengubah data penjualan.");
  }
}

// --- Prospects --------------------------------------------------------------

export async function createProspectAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  let newId: string | null = null;

  try {
    const user = await requireUser();
    assertSalesAccess(user.role);

    const input = prospectSchema.parse({
      companyName: field(formData, "companyName"),
      country: field(formData, "country"),
      city: field(formData, "city"),
      contactPerson: field(formData, "contactPerson"),
      contactRole: field(formData, "contactRole"),
      contactEmail: field(formData, "contactEmail"),
      contactPhone: field(formData, "contactPhone"),
      source: field(formData, "source"),
      status: field(formData, "status") || "baru",
      notes: field(formData, "notes"),
    });

    newId = await query(async (client) => {
      const result = await client.query<{ id: string }>(
        `insert into prospects
           (company_name, country, city, contact_person, contact_role, contact_email,
            contact_phone, source, status, owner_id, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
        [
          input.companyName,
          input.country,
          input.city,
          input.contactPerson,
          input.contactRole,
          input.contactEmail,
          input.contactPhone,
          input.source,
          input.status,
          user.id,
          input.notes,
        ]
      );
      return result.rows[0].id;
    });

    revalidatePath("/prospek");
  } catch (error) {
    return toActionState(error);
  }

  redirect(`/prospek/${newId}`);
}

export async function updateProspectAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    assertSalesAccess(user.role);

    const id = field(formData, "id");
    if (!id) return failure("Prospek tidak ditemukan.");

    const input = prospectSchema.parse({
      companyName: field(formData, "companyName"),
      country: field(formData, "country"),
      city: field(formData, "city"),
      contactPerson: field(formData, "contactPerson"),
      contactRole: field(formData, "contactRole"),
      contactEmail: field(formData, "contactEmail"),
      contactPhone: field(formData, "contactPhone"),
      source: field(formData, "source"),
      status: field(formData, "status"),
      notes: field(formData, "notes"),
    });

    await query(async (client) => {
      await client.query(
        `update prospects set company_name=$2, country=$3, city=$4, contact_person=$5,
           contact_role=$6, contact_email=$7, contact_phone=$8, source=$9, status=$10, notes=$11
         where id=$1`,
        [
          id,
          input.companyName,
          input.country,
          input.city,
          input.contactPerson,
          input.contactRole,
          input.contactEmail,
          input.contactPhone,
          input.source,
          input.status,
          input.notes,
        ]
      );
    });

    revalidatePath(`/prospek/${id}`);
    revalidatePath("/prospek");
    return success("Perubahan prospek tersimpan.");
  } catch (error) {
    return toActionState(error);
  }
}

// --- Meeting notes ----------------------------------------------------------

export async function createMeetingNoteAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    assertSalesAccess(user.role);

    const input = meetingNoteSchema.parse({
      prospectId: field(formData, "prospectId"),
      opportunityId: field(formData, "opportunityId"),
      meetingDate: field(formData, "meetingDate"),
      location: field(formData, "location"),
      attendees: field(formData, "attendees"),
      summary: field(formData, "summary"),
      nextAction: field(formData, "nextAction"),
      nextActionDate: field(formData, "nextActionDate"),
    });

    await query(async (client) => {
      await client.query(
        `insert into meeting_notes
           (prospect_id, opportunity_id, meeting_date, location, attendees, summary,
            next_action, next_action_date, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          input.prospectId,
          input.opportunityId,
          input.meetingDate,
          input.location,
          input.attendees,
          input.summary,
          input.nextAction,
          input.nextActionDate,
          user.id,
        ]
      );
    });

    revalidatePath(`/prospek/${input.prospectId}`);
    if (input.opportunityId) revalidatePath(`/opportunity/${input.opportunityId}`);
    revalidatePath("/");
    return success("Catatan meeting tersimpan.");
  } catch (error) {
    return toActionState(error);
  }
}

// --- Opportunities ----------------------------------------------------------

export async function createOpportunityAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  let newId: string | null = null;

  try {
    const user = await requireUser();
    assertSalesAccess(user.role);

    const input = opportunitySchema.parse({
      prospectId: field(formData, "prospectId"),
      title: field(formData, "title"),
      coalGarKcal: field(formData, "coalGarKcal"),
      coalTmPct: field(formData, "coalTmPct"),
      coalAshPct: field(formData, "coalAshPct"),
      coalSulphurPct: field(formData, "coalSulphurPct"),
      estimatedVolumeTonnes: field(formData, "estimatedVolumeTonnes"),
      estimatedPriceUsdPerTonne: field(formData, "estimatedPriceUsdPerTonne"),
      deliveryTerm: field(formData, "deliveryTerm"),
      expectedCloseDate: field(formData, "expectedCloseDate"),
    });

    newId = await query(async (client) => {
      const result = await client.query<{ id: string }>(
        `insert into opportunities
           (prospect_id, title, coal_gar_kcal, coal_tm_pct, coal_ash_pct, coal_sulphur_pct,
            estimated_volume_tonnes, estimated_price_usd_per_tonne, delivery_term,
            expected_close_date, owner_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
        [
          input.prospectId,
          input.title,
          input.coalGarKcal,
          input.coalTmPct,
          input.coalAshPct,
          input.coalSulphurPct,
          input.estimatedVolumeTonnes,
          input.estimatedPriceUsdPerTonne,
          input.deliveryTerm,
          input.expectedCloseDate,
          user.id,
        ]
      );
      const id = result.rows[0].id;

      await client.query(
        `insert into opportunity_status_history
           (opportunity_id, from_status, to_status, reason, changed_by)
         values ($1, null, 'on_progress', $2, $3)`,
        [id, "Opportunity dibuat.", user.id]
      );

      return id;
    });

    revalidatePath("/opportunity");
    revalidatePath("/");
  } catch (error) {
    return toActionState(error);
  }

  redirect(`/opportunity/${newId}`);
}

export async function changeOpportunityStatusAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    assertSalesAccess(user.role);

    const input = opportunityStatusSchema.parse({
      opportunityId: field(formData, "opportunityId"),
      status: field(formData, "status"),
      reason: field(formData, "reason"),
    });

    await query(async (client) => {
      const current = await client.query<{ status: OpportunityStatus }>(
        `select status from opportunities where id = $1 for update`,
        [input.opportunityId]
      );
      const from = current.rows[0]?.status;
      if (!from) throw new Error("Opportunity tidak ditemukan.");

      // Server-side transition map. Illegal moves are rejected with a message,
      // never silently ignored (specification §10).
      assertTransition(OPPORTUNITY_TRANSITIONS, OPPORTUNITY_STATUS, from, input.status);

      await client.query(`update opportunities set status = $2 where id = $1`, [
        input.opportunityId,
        input.status,
      ]);
      await client.query(
        `insert into opportunity_status_history
           (opportunity_id, from_status, to_status, reason, changed_by)
         values ($1,$2,$3,$4,$5)`,
        [input.opportunityId, from, input.status, input.reason, user.id]
      );
    });

    revalidatePath(`/opportunity/${input.opportunityId}`);
    revalidatePath("/opportunity");
    revalidatePath("/");
    return success(`Status diubah menjadi "${OPPORTUNITY_STATUS[input.status].label}".`);
  } catch (error) {
    return toActionState(error);
  }
}
