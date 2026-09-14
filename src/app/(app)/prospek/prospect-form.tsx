"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { FormActions, FormFeedback, FormGrid, SubmitButton } from "@/components/form-parts";
import { CardBody, CardFooter } from "@/components/ui/card";
import { PROSPECT_STATUS } from "@/domain/status";
import { IDLE } from "@/server/action-state";
import { createProspectAction, updateProspectAction } from "@/server/actions/sales";
import type { Prospect } from "@/domain/types";

export function ProspectForm({ prospect }: { prospect?: Prospect }) {
  const isEdit = Boolean(prospect);
  const [state, formAction] = useActionState(
    isEdit ? updateProspectAction : createProspectAction,
    IDLE
  );

  return (
    <form action={formAction}>
      <CardBody className="space-y-4">
        <FormFeedback state={state} />

        <FormGrid>
          {isEdit ? <input type="hidden" name="id" value={prospect!.id} /> : null}

          <Field
            label="Nama perusahaan"
            htmlFor="companyName"
            required
            error={state.fieldErrors?.companyName}
            className="sm:col-span-2"
          >
            <Input
              id="companyName"
              name="companyName"
              defaultValue={prospect?.companyName}
              placeholder="PT / Co., Ltd"
              required
            />
          </Field>

          <Field label="Negara" htmlFor="country" required error={state.fieldErrors?.country}>
            <Input
              id="country"
              name="country"
              defaultValue={prospect?.country}
              placeholder="Tiongkok, Vietnam, Indonesia…"
              required
            />
          </Field>

          <Field label="Kota" htmlFor="city" error={state.fieldErrors?.city}>
            <Input id="city" name="city" defaultValue={prospect?.city ?? ""} />
          </Field>

          <Field
            label="Nama kontak"
            htmlFor="contactPerson"
            error={state.fieldErrors?.contactPerson}
          >
            <Input
              id="contactPerson"
              name="contactPerson"
              defaultValue={prospect?.contactPerson ?? ""}
            />
          </Field>

          <Field label="Jabatan kontak" htmlFor="contactRole" error={state.fieldErrors?.contactRole}>
            <Input
              id="contactRole"
              name="contactRole"
              defaultValue={prospect?.contactRole ?? ""}
              placeholder="Procurement Manager"
            />
          </Field>

          <Field label="Email kontak" htmlFor="contactEmail" error={state.fieldErrors?.contactEmail}>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={prospect?.contactEmail ?? ""}
            />
          </Field>

          <Field label="Telepon kontak" htmlFor="contactPhone" error={state.fieldErrors?.contactPhone}>
            <Input id="contactPhone" name="contactPhone" defaultValue={prospect?.contactPhone ?? ""} />
          </Field>

          <Field
            label="Sumber prospek"
            htmlFor="source"
            error={state.fieldErrors?.source}
            hint="Contoh: referral, pameran, tender terbuka, inbound"
          >
            <Input id="source" name="source" defaultValue={prospect?.source ?? ""} />
          </Field>

          <Field label="Status" htmlFor="status" required error={state.fieldErrors?.status}>
            <Select id="status" name="status" defaultValue={prospect?.status ?? "baru"}>
              {Object.values(PROSPECT_STATUS).map((meta) => (
                <option key={meta.value} value={meta.value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Catatan"
            htmlFor="notes"
            error={state.fieldErrors?.notes}
            className="sm:col-span-2"
          >
            <Textarea
              id="notes"
              name="notes"
              defaultValue={prospect?.notes ?? ""}
              placeholder="Kebutuhan volume, spesifikasi yang dicari, preferensi term…"
            />
          </Field>
        </FormGrid>
      </CardBody>

      <CardFooter>
        <FormActions>
          <SubmitButton>{isEdit ? "Simpan Perubahan" : "Simpan Prospek"}</SubmitButton>
          <Button asChild variant="secondary" type="button">
            <Link href={isEdit ? `/prospek/${prospect!.id}` : "/prospek"}>Batal</Link>
          </Button>
        </FormActions>
      </CardFooter>
    </form>
  );
}
