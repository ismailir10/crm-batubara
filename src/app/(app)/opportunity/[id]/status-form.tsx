"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { FormFeedback, SubmitButton } from "@/components/form-parts";
import { Alert } from "@/components/ui/feedback";
import { OPPORTUNITY_STATUS, OPPORTUNITY_TRANSITIONS } from "@/domain/status";
import { IDLE } from "@/server/action-state";
import { changeOpportunityStatusAction } from "@/server/actions/sales";
import type { OpportunityStatus } from "@/domain/types";

/**
 * Only transitions the status model actually permits are offered. The server
 * re-checks the same map, so this is a convenience, not the enforcement.
 */
export function OpportunityStatusForm({
  opportunityId,
  currentStatus,
}: {
  opportunityId: string;
  currentStatus: OpportunityStatus;
}) {
  const [state, formAction] = useActionState(changeOpportunityStatusAction, IDLE);
  const [open, setOpen] = useState(false);

  const allowed = OPPORTUNITY_TRANSITIONS[currentStatus];

  if (allowed.length === 0) {
    return (
      <Alert variant="info">
        Status <strong>{OPPORTUNITY_STATUS[currentStatus].label}</strong> bersifat final dan
        tidak dapat diubah lagi.
      </Alert>
    );
  }

  if (!open) {
    return (
      <div className="space-y-3">
        {state.status === "success" ? <FormFeedback state={state} /> : null}
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Ubah Status
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <FormFeedback state={state} />
      <input type="hidden" name="opportunityId" value={opportunityId} />

      <Field label="Status baru" htmlFor="status" required error={state.fieldErrors?.status}>
        <Select id="status" name="status" defaultValue={allowed[0]} required>
          {allowed.map((status) => (
            <option key={status} value={status}>
              {OPPORTUNITY_STATUS[status].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Alasan perubahan"
        htmlFor="reason"
        required
        error={state.fieldErrors?.reason}
        hint="Tercatat permanen pada riwayat status."
      >
        <Textarea
          id="reason"
          name="reason"
          required
          placeholder="Contoh: harga dan term disepakati, dilanjutkan ke kontrak."
          className="min-h-20"
        />
      </Field>

      <div className="flex items-center gap-2">
        <SubmitButton size="sm" pendingLabel="Memproses…">
          Simpan Status
        </SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
