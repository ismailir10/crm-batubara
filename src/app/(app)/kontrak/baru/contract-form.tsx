"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";
import { FormActions, FormFeedback, FormGrid, SubmitButton } from "@/components/form-parts";
import { CardBody, CardFooter } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { IDLE } from "@/server/action-state";
import { createContractAction } from "@/server/actions/contracts";
import { formatTonnes, formatUsd } from "@/lib/format";
import type { SalesApprovalForm } from "@/domain/types";

interface StageRow {
  key: number;
  volume: string;
  start: string;
  end: string;
  notes: string;
}

export function ContractForm({ approval }: { approval: SalesApprovalForm }) {
  const [state, formAction] = useActionState(createContractAction, IDLE);
  const [totalVolume, setTotalVolume] = useState(String(approval.proposedVolumeTonnes));
  const [stages, setStages] = useState<StageRow[]>(() =>
    defaultStages(approval)
  );

  const stageSum = stages.reduce((sum, stage) => sum + (Number(stage.volume) || 0), 0);
  const total = Number(totalVolume) || 0;
  const difference = Math.round((stageSum - total) * 100) / 100;
  const balanced = Math.abs(difference) <= 0.01;

  function updateStage(key: number, patch: Partial<StageRow>) {
    setStages((current) =>
      current.map((stage) => (stage.key === key ? { ...stage, ...patch } : stage))
    );
  }

  function addStage() {
    setStages((current) => [
      ...current,
      { key: Date.now(), volume: "", start: "", end: "", notes: "" },
    ]);
  }

  function removeStage(key: number) {
    setStages((current) => (current.length <= 1 ? current : current.filter((s) => s.key !== key)));
  }

  return (
    <form action={formAction}>
      <CardBody className="space-y-5">
        <FormFeedback state={state} />

        <input type="hidden" name="salesApprovalFormId" value={approval.id} />

        <FormGrid>
          <Field
            label="Judul kontrak"
            htmlFor="title"
            required
            error={state.fieldErrors?.title}
            className="sm:col-span-2"
          >
            <Input
              id="title"
              name="title"
              defaultValue={`Kontrak Payung Pasokan Batubara — ${approval.prospectName}`}
              required
            />
          </Field>

          <Field
            label="Total volume (MT)"
            htmlFor="totalVolumeTonnes"
            required
            error={state.fieldErrors?.totalVolumeTonnes}
          >
            <Input
              id="totalVolumeTonnes"
              name="totalVolumeTonnes"
              type="number"
              min="1"
              step="1"
              value={totalVolume}
              onChange={(event) => setTotalVolume(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Harga (USD/MT)"
            htmlFor="priceUsdPerTonne"
            required
            error={state.fieldErrors?.priceUsdPerTonne}
            hint={
              total > 0
                ? `Nilai kontrak: ${formatUsd(total * approval.proposedPriceUsdPerTonne, 0)}`
                : undefined
            }
          >
            <Input
              id="priceUsdPerTonne"
              name="priceUsdPerTonne"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={approval.proposedPriceUsdPerTonne}
              required
            />
          </Field>

          <Field
            label="Dasar harga"
            htmlFor="priceBasis"
            required
            error={state.fieldErrors?.priceBasis}
            className="sm:col-span-2"
          >
            <Input
              id="priceBasis"
              name="priceBasis"
              defaultValue={`Harga tetap (fixed) USD/MT, ${approval.deliveryTerm}`}
              required
            />
          </Field>

          <Field
            label="Periode mulai"
            htmlFor="periodStart"
            required
            error={state.fieldErrors?.periodStart}
          >
            <Input
              id="periodStart"
              name="periodStart"
              type="date"
              defaultValue={approval.contractPeriodStart ?? todayIso()}
              required
            />
          </Field>

          <Field
            label="Periode selesai"
            htmlFor="periodEnd"
            required
            error={state.fieldErrors?.periodEnd}
          >
            <Input
              id="periodEnd"
              name="periodEnd"
              type="date"
              defaultValue={approval.contractPeriodEnd ?? oneYearFromTodayIso()}
              required
            />
          </Field>
        </FormGrid>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <Label>Tahap Pengiriman</Label>
              <p className="mt-0.5 text-xs text-ink-500">
                Jumlah volume seluruh tahap harus sama dengan total volume kontrak.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addStage}>
              <Plus />
              Tambah Tahap
            </Button>
          </div>

          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div
                key={stage.key}
                className="grid grid-cols-1 gap-2 rounded-md bg-ink-25 p-3 sm:grid-cols-[auto_1fr_1fr_1fr_1.5fr_auto] sm:items-end"
              >
                <div className="text-[13px] font-semibold text-ink-700 sm:pb-2">
                  Tahap {index + 1}
                </div>

                <div>
                  <Label htmlFor={`stageVolume-${stage.key}`} className="mb-1">
                    Volume (MT)
                  </Label>
                  <Input
                    id={`stageVolume-${stage.key}`}
                    name="stageVolume"
                    type="number"
                    min="1"
                    step="1"
                    value={stage.volume}
                    onChange={(event) => updateStage(stage.key, { volume: event.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`stageStart-${stage.key}`} className="mb-1">
                    Mulai
                  </Label>
                  <Input
                    id={`stageStart-${stage.key}`}
                    name="stageStart"
                    type="date"
                    value={stage.start}
                    onChange={(event) => updateStage(stage.key, { start: event.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`stageEnd-${stage.key}`} className="mb-1">
                    Selesai
                  </Label>
                  <Input
                    id={`stageEnd-${stage.key}`}
                    name="stageEnd"
                    type="date"
                    value={stage.end}
                    onChange={(event) => updateStage(stage.key, { end: event.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`stageNotes-${stage.key}`} className="mb-1">
                    Catatan
                  </Label>
                  <Input
                    id={`stageNotes-${stage.key}`}
                    name="stageNotes"
                    value={stage.notes}
                    onChange={(event) => updateStage(stage.key, { notes: event.target.value })}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus tahap ${index + 1}`}
                  disabled={stages.length <= 1}
                  onClick={() => removeStage(stage.key)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-3">
            {balanced ? (
              <Alert variant="success">
                Total tahap {formatTonnes(stageSum)} sesuai dengan volume kontrak.
              </Alert>
            ) : (
              <Alert variant="warning">
                Total tahap {formatTonnes(stageSum)} belum sesuai volume kontrak{" "}
                {formatTonnes(total)}. Selisih {difference > 0 ? "+" : "−"}
                {formatTonnes(Math.abs(difference))}.
              </Alert>
            )}
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <FormActions>
          <SubmitButton>Simpan Kontrak</SubmitButton>
          <Button asChild variant="secondary" type="button">
            <Link href={`/persetujuan/${approval.id}`}>Batal</Link>
          </Button>
        </FormActions>
      </CardFooter>
    </form>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function oneYearFromTodayIso() {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

/** Four even stages across the approved contract period, as a starting point. */
function defaultStages(approval: SalesApprovalForm): StageRow[] {
  const start = approval.contractPeriodStart ?? todayIso();
  const end = approval.contractPeriodEnd ?? oneYearFromTodayIso();
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  const count = 4;
  const span = Math.max(endTime - startTime, 0) / count;
  const perStage = Math.round((approval.proposedVolumeTonnes / count) * 100) / 100;

  return Array.from({ length: count }, (_, index) => {
    const stageStart = new Date(startTime + span * index);
    const stageEnd = new Date(startTime + span * (index + 1) - 86_400_000);
    const isLast = index === count - 1;
    return {
      key: index,
      // Remainder lands on the final stage so the total always matches exactly.
      volume: String(
        isLast
          ? Math.round((approval.proposedVolumeTonnes - perStage * (count - 1)) * 100) / 100
          : perStage
      ),
      start: stageStart.toISOString().slice(0, 10),
      end: (isLast ? new Date(endTime) : stageEnd).toISOString().slice(0, 10),
      notes: `Tahap ${index + 1}`,
    };
  });
}
