"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { FormActions, FormFeedback, FormGrid, SubmitButton } from "@/components/form-parts";
import { CardBody, CardFooter } from "@/components/ui/card";
import { IDLE } from "@/server/action-state";
import { createOpportunityAction } from "@/server/actions/sales";
import { formatUsd } from "@/lib/format";

const DELIVERY_TERMS = ["FOB Barge", "FOB Vessel", "CIF", "CFR"];

export function OpportunityForm({
  prospects,
  defaultProspectId,
}: {
  prospects: { id: string; label: string }[];
  defaultProspectId?: string;
}) {
  const [state, formAction] = useActionState(createOpportunityAction, IDLE);
  const [volume, setVolume] = useState("");
  const [price, setPrice] = useState("");

  const estimated =
    Number(volume) > 0 && Number(price) > 0 ? Number(volume) * Number(price) : null;

  return (
    <form action={formAction}>
      <CardBody className="space-y-4">
        <FormFeedback state={state} />

        <FormGrid>
          <Field
            label="Prospek"
            htmlFor="prospectId"
            required
            error={state.fieldErrors?.prospectId}
            className="sm:col-span-2"
            hint={
              prospects.length === 0
                ? "Belum ada prospek terkualifikasi. Tambahkan prospek terlebih dahulu."
                : undefined
            }
          >
            <Select
              id="prospectId"
              name="prospectId"
              defaultValue={defaultProspectId ?? ""}
              required
            >
              <option value="" disabled>
                — Pilih prospek —
              </option>
              {prospects.map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospect.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Judul opportunity"
            htmlFor="title"
            required
            error={state.fieldErrors?.title}
            className="sm:col-span-2"
          >
            <Input
              id="title"
              name="title"
              placeholder="Pasokan GAR 4200 — kontrak payung 300.000 MT"
              required
            />
          </Field>

          <Field
            label="Estimasi volume (MT)"
            htmlFor="estimatedVolumeTonnes"
            required
            error={state.fieldErrors?.estimatedVolumeTonnes}
          >
            <Input
              id="estimatedVolumeTonnes"
              name="estimatedVolumeTonnes"
              type="number"
              min="1"
              step="1"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Estimasi harga (USD/MT)"
            htmlFor="estimatedPriceUsdPerTonne"
            required
            error={state.fieldErrors?.estimatedPriceUsdPerTonne}
            hint={estimated ? `Estimasi nilai: ${formatUsd(estimated, 0)}` : undefined}
          >
            <Input
              id="estimatedPriceUsdPerTonne"
              name="estimatedPriceUsdPerTonne"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Delivery term"
            htmlFor="deliveryTerm"
            required
            error={state.fieldErrors?.deliveryTerm}
          >
            <Select id="deliveryTerm" name="deliveryTerm" defaultValue="FOB Vessel" required>
              {DELIVERY_TERMS.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Target close"
            htmlFor="expectedCloseDate"
            error={state.fieldErrors?.expectedCloseDate}
          >
            <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
          </Field>
        </FormGrid>

        <div>
          <p className="label-caps mb-2">Spesifikasi Batubara</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="GAR (kcal/kg)" htmlFor="coalGarKcal" error={state.fieldErrors?.coalGarKcal}>
              <Input id="coalGarKcal" name="coalGarKcal" type="number" step="1" placeholder="4200" />
            </Field>
            <Field label="TM (%)" htmlFor="coalTmPct" error={state.fieldErrors?.coalTmPct}>
              <Input id="coalTmPct" name="coalTmPct" type="number" step="0.01" placeholder="32.5" />
            </Field>
            <Field label="Ash (%)" htmlFor="coalAshPct" error={state.fieldErrors?.coalAshPct}>
              <Input id="coalAshPct" name="coalAshPct" type="number" step="0.01" placeholder="5.2" />
            </Field>
            <Field
              label="Sulphur (%)"
              htmlFor="coalSulphurPct"
              error={state.fieldErrors?.coalSulphurPct}
            >
              <Input
                id="coalSulphurPct"
                name="coalSulphurPct"
                type="number"
                step="0.01"
                placeholder="0.45"
              />
            </Field>
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <FormActions>
          <SubmitButton>Simpan Opportunity</SubmitButton>
          <Button asChild variant="secondary" type="button">
            <Link href="/opportunity">Batal</Link>
          </Button>
        </FormActions>
      </CardFooter>
    </form>
  );
}
