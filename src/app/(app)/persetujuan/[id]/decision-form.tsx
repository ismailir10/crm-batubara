"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/form";
import { FormFeedback, SubmitButton } from "@/components/form-parts";
import { IDLE } from "@/server/action-state";
import { decideApprovalFormAction, submitApprovalFormAction } from "@/server/actions/approvals";

type Decision = "disetujui" | "ditolak" | "perlu_revisi";

const DECISION_COPY: Record<Decision, { title: string; hint: string; cta: string }> = {
  disetujui: {
    title: "Setujui pengajuan",
    hint: "Catatan persetujuan akan tercatat permanen pada form dan dapat dilihat tim penjualan.",
    cta: "Setujui",
  },
  ditolak: {
    title: "Tolak pengajuan",
    hint: "Opportunity akan dikembalikan ke status Pending dengan alasan penolakan tercatat pada riwayatnya.",
    cta: "Tolak",
  },
  perlu_revisi: {
    title: "Kembalikan untuk revisi",
    hint: "Form dikembalikan ke tim penjualan untuk diperbaiki dan diajukan ulang.",
    cta: "Kembalikan",
  },
};

/**
 * Decision controls are rendered only for the management role. The same rule is
 * enforced in the server action and, independently, by the RLS policy — so a
 * request that skips this UI still fails at the database (AC-09).
 */
export function DecisionForm({ safId }: { safId: string }) {
  const [state, formAction] = useActionState(decideApprovalFormAction, IDLE);
  const [decision, setDecision] = useState<Decision | null>(null);

  if (state.status === "success") {
    return <FormFeedback state={state} />;
  }

  if (!decision) {
    return (
      <div className="space-y-3">
        <FormFeedback state={state} />
        <div className="flex flex-wrap gap-2">
          <Button variant="success" onClick={() => setDecision("disetujui")}>
            <CheckCircle2 />
            Setujui
          </Button>
          <Button variant="danger" onClick={() => setDecision("ditolak")}>
            <XCircle />
            Tolak
          </Button>
          <Button variant="secondary" onClick={() => setDecision("perlu_revisi")}>
            <RotateCcw />
            Minta Revisi
          </Button>
        </div>
      </div>
    );
  }

  const copy = DECISION_COPY[decision];

  return (
    <form action={formAction} className="space-y-3">
      <FormFeedback state={state} />
      <input type="hidden" name="safId" value={safId} />
      <input type="hidden" name="decision" value={decision} />

      <p className="text-[13px] font-semibold text-ink-900">{copy.title}</p>

      <Field
        label="Catatan keputusan"
        htmlFor="decisionNote"
        required
        error={state.fieldErrors?.decisionNote}
        hint={copy.hint}
      >
        <Textarea id="decisionNote" name="decisionNote" required className="min-h-24" />
      </Field>

      <div className="flex items-center gap-2">
        <SubmitButton
          variant={decision === "disetujui" ? "success" : decision === "ditolak" ? "danger" : "primary"}
          pendingLabel="Memproses…"
        >
          {copy.cta}
        </SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setDecision(null)}>
          Batal
        </Button>
      </div>
    </form>
  );
}

/** Moves a draft form into the approval queue. */
export function SubmitForApprovalForm({ safId }: { safId: string }) {
  const [state, formAction] = useActionState(submitApprovalFormAction, IDLE);

  return (
    <form action={formAction} className="space-y-3">
      <FormFeedback state={state} />
      <input type="hidden" name="safId" value={safId} />
      <SubmitButton pendingLabel="Mengajukan…">Ajukan ke Manajemen</SubmitButton>
    </form>
  );
}
