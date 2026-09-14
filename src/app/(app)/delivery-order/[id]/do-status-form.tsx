"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { FormFeedback, SubmitButton } from "@/components/form-parts";
import { Alert } from "@/components/ui/feedback";
import { DO_STATUS, DO_TRANSITIONS } from "@/domain/status";
import { IDLE } from "@/server/action-state";
import { changeDeliveryOrderStatusAction } from "@/server/actions/delivery";
import type { DoStatus } from "@/domain/types";

export function DeliveryOrderStatusForm({
  deliveryOrderId,
  currentStatus,
  plannedVolumeTonnes,
  canManage,
}: {
  deliveryOrderId: string;
  currentStatus: DoStatus;
  plannedVolumeTonnes: number;
  canManage: boolean;
}) {
  const [state, formAction] = useActionState(changeDeliveryOrderStatusAction, IDLE);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DoStatus | "">("");

  const allowed = DO_TRANSITIONS[currentStatus];

  if (!canManage) {
    return (
      <Alert variant="info">
        Perubahan status Delivery Order hanya dapat dilakukan oleh Sales Manager atau Manajemen.
      </Alert>
    );
  }

  if (allowed.length === 0) {
    return (
      <Alert variant="info">
        Status <strong>{DO_STATUS[currentStatus].label}</strong> bersifat final.
      </Alert>
    );
  }

  if (!open) {
    return (
      <div className="space-y-3">
        {state.status === "success" ? <FormFeedback state={state} /> : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setStatus(allowed[0]);
            setOpen(true);
          }}
        >
          Ubah Status
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <FormFeedback state={state} />
      <input type="hidden" name="deliveryOrderId" value={deliveryOrderId} />

      <Field label="Status baru" htmlFor="status" required error={state.fieldErrors?.status}>
        <Select
          id="status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as DoStatus)}
          required
        >
          {allowed.map((value) => (
            <option key={value} value={value}>
              {DO_STATUS[value].label}
            </option>
          ))}
        </Select>
      </Field>

      {status === "selesai" ? (
        <Field
          label="Volume aktual dimuat (MT)"
          htmlFor="actualVolumeTonnes"
          required
          error={state.fieldErrors?.actualVolumeTonnes}
          hint={`Rencana ${plannedVolumeTonnes.toLocaleString("id-ID")} MT. Realisasi biasanya berbeda sedikit dari rencana.`}
        >
          <Input
            id="actualVolumeTonnes"
            name="actualVolumeTonnes"
            type="number"
            min="1"
            step="1"
            defaultValue={plannedVolumeTonnes}
            required
          />
        </Field>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton size="sm" pendingLabel="Memproses…">
          Simpan
        </SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
