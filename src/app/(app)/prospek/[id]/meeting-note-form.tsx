"use client";

import { useActionState, useState } from "react";
import { NotebookPen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { FormActions, FormFeedback, FormGrid, SubmitButton } from "@/components/form-parts";
import { IDLE } from "@/server/action-state";
import { createMeetingNoteAction } from "@/server/actions/sales";

export function MeetingNoteForm({
  prospectId,
  opportunityId,
  opportunityOptions = [],
}: {
  prospectId: string;
  opportunityId?: string;
  opportunityOptions?: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createMeetingNoteAction, IDLE);

  // Collapse the panel once a save succeeds. Adjusting state during render
  // rather than in an effect avoids a cascading re-render; the form unmounts,
  // which also clears the fields.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.status === "success" && open) setOpen(false);
  }

  if (!open) {
    return (
      <div className="space-y-3">
        {state.status === "success" ? <FormFeedback state={state} /> : null}
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <NotebookPen />
          Tambah Catatan Meeting
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-lg bg-ink-25 p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink-900">Catatan Meeting Baru</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Tutup"
          onClick={() => setOpen(false)}
        >
          <X />
        </Button>
      </div>

      <FormFeedback state={state} />

      <input type="hidden" name="prospectId" value={prospectId} />
      {opportunityId ? (
        <input type="hidden" name="opportunityId" value={opportunityId} />
      ) : null}

      <FormGrid>
        <Field
          label="Tanggal meeting"
          htmlFor="meetingDate"
          required
          error={state.fieldErrors?.meetingDate}
        >
          <Input
            id="meetingDate"
            name="meetingDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </Field>

        <Field label="Lokasi" htmlFor="location" error={state.fieldErrors?.location}>
          <Input id="location" name="location" placeholder="Video call, kantor Jakarta…" />
        </Field>

        {!opportunityId && opportunityOptions.length > 0 ? (
          <Field
            label="Kaitkan dengan opportunity"
            htmlFor="opportunityId"
            className="sm:col-span-2"
            hint="Opsional. Catatan tetap tersimpan pada prospek."
          >
            <select
              id="opportunityId"
              name="opportunityId"
              defaultValue=""
              className="h-8 w-full rounded-md bg-white px-2.5 pr-7 text-[13px] text-ink-900 shadow-[0_0_0_1px_rgb(10_37_64/0.10),0_1px_1px_rgb(10_37_64/0.04)] focus:outline-none"
            >
              <option value="">— Tidak dikaitkan —</option>
              {opportunityOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field
          label="Peserta"
          htmlFor="attendees"
          required
          error={state.fieldErrors?.attendees}
          className="sm:col-span-2"
        >
          <Input
            id="attendees"
            name="attendees"
            placeholder="Nama (perusahaan), nama internal…"
            required
          />
        </Field>

        <Field
          label="Ringkasan diskusi"
          htmlFor="summary"
          required
          error={state.fieldErrors?.summary}
          className="sm:col-span-2"
        >
          <Textarea id="summary" name="summary" required />
        </Field>

        <Field label="Tindak lanjut" htmlFor="nextAction" error={state.fieldErrors?.nextAction}>
          <Input id="nextAction" name="nextAction" placeholder="Kirim indikasi harga…" />
        </Field>

        <Field
          label="Tanggal tindak lanjut"
          htmlFor="nextActionDate"
          error={state.fieldErrors?.nextActionDate}
        >
          <Input id="nextActionDate" name="nextActionDate" type="date" />
        </Field>
      </FormGrid>

      <FormActions>
        <SubmitButton size="sm">Simpan Catatan</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </FormActions>
    </form>
  );
}
