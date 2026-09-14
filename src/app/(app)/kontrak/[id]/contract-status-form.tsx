"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { FormFeedback, SubmitButton } from "@/components/form-parts";
import { Alert } from "@/components/ui/feedback";
import { CONTRACT_STATUS, CONTRACT_TRANSITIONS } from "@/domain/status";
import { IDLE } from "@/server/action-state";
import { changeContractStatusAction } from "@/server/actions/contracts";
import type { ContractStatus } from "@/domain/types";

export function ContractStatusForm({
  contractId,
  currentStatus,
  canManage,
}: {
  contractId: string;
  currentStatus: ContractStatus;
  canManage: boolean;
}) {
  const [state, formAction] = useActionState(changeContractStatusAction, IDLE);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ContractStatus | "">("");

  const allowed = CONTRACT_TRANSITIONS[currentStatus];

  if (!canManage) {
    return (
      <Alert variant="info">
        Perubahan status kontrak hanya dapat dilakukan oleh Sales Manager atau Manajemen.
      </Alert>
    );
  }

  if (allowed.length === 0) {
    return (
      <Alert variant="info">
        Status <strong>{CONTRACT_STATUS[currentStatus].label}</strong> bersifat final.
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
          Ubah Status Kontrak
        </Button>
      </div>
    );
  }

  const needsSignatureDate =
    status === "ditandatangani_satu_pihak" || status === "ditandatangani_penuh";

  return (
    <form action={formAction} className="space-y-3">
      <FormFeedback state={state} />
      <input type="hidden" name="contractId" value={contractId} />

      <Field label="Status baru" htmlFor="status" required error={state.fieldErrors?.status}>
        <Select
          id="status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as ContractStatus)}
          required
        >
          {allowed.map((value) => (
            <option key={value} value={value}>
              {CONTRACT_STATUS[value].label}
            </option>
          ))}
        </Select>
      </Field>

      {needsSignatureDate ? (
        <Field
          label="Tanggal tanda tangan"
          htmlFor="signatureDate"
          hint="Dikosongkan berarti menggunakan tanggal hari ini."
          error={state.fieldErrors?.signatureDate}
        >
          <Input id="signatureDate" name="signatureDate" type="date" />
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
