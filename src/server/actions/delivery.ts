"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ForbiddenError, query, requireUser } from "@/lib/session";
import { deliveryOrderSchema, deliveryOrderStatusSchema } from "@/domain/schemas";
import { DO_STATUS, DO_TRANSITIONS, assertTransition, canManageContracts } from "@/domain/status";
import { ValidationError, assertStageCapacity } from "@/domain/calc";
import type { DoStatus } from "@/domain/types";
import { field, success, toActionState, type ActionState } from "../action-state";

export async function createDeliveryOrderAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  let newId: string | null = null;

  try {
    const user = await requireUser();
    if (!canManageContracts(user.role)) {
      throw new ForbiddenError(
        "Hanya Sales Manager atau Manajemen yang dapat membuat Delivery Order."
      );
    }

    const input = deliveryOrderSchema.parse({
      contractId: field(formData, "contractId"),
      stageId: field(formData, "stageId"),
      plannedVolumeTonnes: field(formData, "plannedVolumeTonnes"),
      laycanStart: field(formData, "laycanStart"),
      laycanEnd: field(formData, "laycanEnd"),
      loadingPoint: field(formData, "loadingPoint"),
      destination: field(formData, "destination"),
      vesselName: field(formData, "vesselName"),
    });

    newId = await query(async (client) => {
      const stage = await client.query<{
        id: string;
        stage_no: number;
        planned_volume_tonnes: number;
        contract_id: string;
        allocated: number;
      }>(
        `select st.id, st.stage_no, st.planned_volume_tonnes, st.contract_id,
                coalesce((select sum(d.planned_volume_tonnes) from delivery_orders d
                          where d.stage_id = st.id and d.status <> 'dibatalkan'), 0) as allocated
         from contract_delivery_stages st
         where st.id = $1
         for update`,
        [input.stageId]
      );
      const row = stage.rows[0];
      if (!row) throw new ValidationError("Tahap pengiriman tidak ditemukan.");
      if (row.contract_id !== input.contractId) {
        throw new ValidationError("Tahap pengiriman tidak sesuai dengan kontrak yang dipilih.");
      }

      // Over-allocation is the mistake this module exists to prevent.
      assertStageCapacity(
        { stageNo: row.stage_no, plannedVolumeTonnes: Number(row.planned_volume_tonnes) },
        Number(row.allocated),
        input.plannedVolumeTonnes
      );

      const inserted = await client.query<{ id: string }>(
        `insert into delivery_orders
           (contract_id, stage_id, planned_volume_tonnes, laycan_start, laycan_end,
            loading_point, destination, vessel_name, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [
          input.contractId,
          input.stageId,
          input.plannedVolumeTonnes,
          input.laycanStart,
          input.laycanEnd,
          input.loadingPoint,
          input.destination,
          input.vesselName,
          user.id,
        ]
      );
      return inserted.rows[0].id;
    });

    revalidatePath("/delivery-order");
    revalidatePath(`/kontrak/${field(formData, "contractId")}`);
    revalidatePath("/");
  } catch (error) {
    return toActionState(error);
  }

  redirect(`/delivery-order/${newId}`);
}

export async function changeDeliveryOrderStatusAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    if (!canManageContracts(user.role)) {
      throw new ForbiddenError(
        "Hanya Sales Manager atau Manajemen yang dapat mengubah status Delivery Order."
      );
    }

    const input = deliveryOrderStatusSchema.parse({
      deliveryOrderId: field(formData, "deliveryOrderId"),
      status: field(formData, "status"),
      actualVolumeTonnes: field(formData, "actualVolumeTonnes"),
    });

    const contractId = await query(async (client) => {
      const current = await client.query<{ status: DoStatus; contract_id: string }>(
        `select status, contract_id from delivery_orders where id = $1 for update`,
        [input.deliveryOrderId]
      );
      const row = current.rows[0];
      if (!row) throw new ValidationError("Delivery Order tidak ditemukan.");

      assertTransition(DO_TRANSITIONS, DO_STATUS, row.status, input.status);

      // Completing a delivery order without the loaded tonnage would leave the
      // planned-versus-delivered figures quietly wrong.
      if (input.status === "selesai") {
        if (input.actualVolumeTonnes === null || input.actualVolumeTonnes <= 0) {
          throw new ValidationError(
            "Volume aktual wajib diisi saat Delivery Order diselesaikan."
          );
        }
        await client.query(
          `update delivery_orders set status = $2, actual_volume_tonnes = $3 where id = $1`,
          [input.deliveryOrderId, input.status, input.actualVolumeTonnes]
        );
      } else {
        await client.query(`update delivery_orders set status = $2 where id = $1`, [
          input.deliveryOrderId,
          input.status,
        ]);
      }

      return row.contract_id;
    });

    revalidatePath(`/delivery-order/${input.deliveryOrderId}`);
    revalidatePath("/delivery-order");
    revalidatePath(`/kontrak/${contractId}`);
    revalidatePath("/");
    return success(`Status Delivery Order diubah menjadi "${DO_STATUS[input.status].label}".`);
  } catch (error) {
    return toActionState(error);
  }
}
