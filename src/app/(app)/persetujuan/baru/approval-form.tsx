"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { FormActions, FormFeedback, FormGrid, SubmitButton } from "@/components/form-parts";
import { CardBody, CardFooter } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { IDLE } from "@/server/action-state";
import { createApprovalFormAction } from "@/server/actions/approvals";
import { formatDate, formatPrice, formatUsd } from "@/lib/format";

export interface ReferenceOption {
  code: string;
  name: string;
  specLabel: string | null;
  latestPrice: number | null;
  latestDate: string | null;
}

export function ApprovalForm({
  opportunities,
  references,
  defaultOpportunityId,
}: {
  opportunities: { id: string; label: string }[];
  references: ReferenceOption[];
  defaultOpportunityId?: string;
}) {
  const [state, formAction] = useActionState(createApprovalFormAction, IDLE);
  const [volume, setVolume] = useState("");
  const [price, setPrice] = useState("");
  const [refCode, setRefCode] = useState(references[0]?.code ?? "");

  const value = Number(volume) > 0 && Number(price) > 0 ? Number(volume) * Number(price) : null;
  const selectedReference = references.find((r) => r.code === refCode) ?? null;
  const spread =
    selectedReference?.latestPrice && Number(price) > 0
      ? Number(price) - selectedReference.latestPrice
      : null;

  return (
    <form action={formAction}>
      <CardBody className="space-y-4">
        <FormFeedback state={state} />

        {opportunities.length === 0 ? (
          <Alert variant="warning">
            Tidak ada opportunity yang tersedia. Sebuah opportunity hanya dapat memiliki satu form
            aktif, dan hanya opportunity berstatus On Progress atau Pending yang dapat diajukan.
          </Alert>
        ) : null}

        <FormGrid>
          <Field
            label="Opportunity"
            htmlFor="opportunityId"
            required
            error={state.fieldErrors?.opportunityId}
            className="sm:col-span-2"
          >
            <Select
              id="opportunityId"
              name="opportunityId"
              defaultValue={defaultOpportunityId ?? ""}
              required
            >
              <option value="" disabled>
                — Pilih opportunity —
              </option>
              {opportunities.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Volume diajukan (MT)"
            htmlFor="proposedVolumeTonnes"
            required
            error={state.fieldErrors?.proposedVolumeTonnes}
          >
            <Input
              id="proposedVolumeTonnes"
              name="proposedVolumeTonnes"
              type="number"
              min="1"
              step="1"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Harga diajukan (USD/MT)"
            htmlFor="proposedPriceUsdPerTonne"
            required
            error={state.fieldErrors?.proposedPriceUsdPerTonne}
            hint={value ? `Nilai kontrak: ${formatUsd(value, 0)}` : undefined}
          >
            <Input
              id="proposedPriceUsdPerTonne"
              name="proposedPriceUsdPerTonne"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Term pembayaran"
            htmlFor="paymentTerm"
            required
            error={state.fieldErrors?.paymentTerm}
          >
            <Input
              id="paymentTerm"
              name="paymentTerm"
              placeholder="LC at sight, 100% saat penyerahan dokumen"
              required
            />
          </Field>

          <Field
            label="Delivery term"
            htmlFor="deliveryTerm"
            required
            error={state.fieldErrors?.deliveryTerm}
          >
            <Input id="deliveryTerm" name="deliveryTerm" defaultValue="FOB Vessel" required />
          </Field>

          <Field
            label="Periode kontrak mulai"
            htmlFor="contractPeriodStart"
            error={state.fieldErrors?.contractPeriodStart}
          >
            <Input id="contractPeriodStart" name="contractPeriodStart" type="date" />
          </Field>

          <Field
            label="Periode kontrak selesai"
            htmlFor="contractPeriodEnd"
            error={state.fieldErrors?.contractPeriodEnd}
          >
            <Input id="contractPeriodEnd" name="contractPeriodEnd" type="date" />
          </Field>
        </FormGrid>

        <div className="rounded-lg bg-accent-soft/60 p-4">
          <p className="text-[13px] font-semibold text-ink-900">Referensi Harga Pasar</p>
          <p className="mt-0.5 text-xs text-ink-600">
            Harga indeks pada saat pengajuan akan <strong>dikunci</strong> pada form ini, sehingga
            manajemen menilai harga terhadap acuan pasar hari pengajuan — bukan hari mereka membuka
            form.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Sumber indeks" htmlFor="refSourceCode">
              <Select
                id="refSourceCode"
                name="refSourceCode"
                value={refCode}
                onChange={(event) => setRefCode(event.target.value)}
              >
                <option value="">— Tanpa referensi —</option>
                {references.map((reference) => (
                  <option key={reference.code} value={reference.code}>
                    {reference.code} — {reference.specLabel ?? reference.name}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedReference?.latestPrice ? (
              <div className="text-[13px]">
                <p className="label-caps mb-1">Harga indeks terkini</p>
                <p className="tnum text-lg font-semibold text-ink-900">
                  {formatPrice(selectedReference.latestPrice)}{" "}
                  <span className="text-xs font-normal text-ink-500">USD/MT</span>
                </p>
                <p className="text-xs text-ink-500">
                  Per {formatDate(selectedReference.latestDate)} · data sintetis
                </p>
                {spread !== null ? (
                  <p
                    className={
                      spread >= 0
                        ? "tnum mt-1 text-xs font-medium text-success-ink"
                        : "tnum mt-1 text-xs font-medium text-danger-ink"
                    }
                  >
                    Selisih harga usulan: {spread >= 0 ? "+" : "−"}
                    {formatPrice(Math.abs(spread))} USD/MT
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <Field
          label="Justifikasi"
          htmlFor="justification"
          required
          error={state.fieldErrors?.justification}
          hint="Dasar komersial pengajuan: posisi harga terhadap indeks, riwayat buyer, dampak terhadap serapan produksi."
        >
          <Textarea id="justification" name="justification" required className="min-h-32" />
        </Field>
      </CardBody>

      <CardFooter>
        <FormActions>
          <SubmitButton name="submitNow" value="yes">
            Simpan &amp; Ajukan ke Manajemen
          </SubmitButton>
          <SubmitButton name="submitNow" value="no" variant="secondary">
            Simpan sebagai Draft
          </SubmitButton>
          <Button asChild variant="ghost" type="button">
            <Link href="/persetujuan">Batal</Link>
          </Button>
        </FormActions>
      </CardFooter>
    </form>
  );
}
