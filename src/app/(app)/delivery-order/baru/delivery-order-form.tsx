"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { FormActions, FormFeedback, FormGrid, SubmitButton } from "@/components/form-parts";
import { CardBody, CardFooter } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { IDLE } from "@/server/action-state";
import { createDeliveryOrderAction } from "@/server/actions/delivery";
import { formatDateShort, formatTonnes } from "@/lib/format";
import type { DeliveryStage } from "@/domain/types";

export interface ContractOption {
  id: string;
  label: string;
  stages: DeliveryStage[];
}

export function DeliveryOrderForm({
  contracts,
  defaultContractId,
}: {
  contracts: ContractOption[];
  defaultContractId?: string;
}) {
  const [state, formAction] = useActionState(createDeliveryOrderAction, IDLE);
  const [contractId, setContractId] = useState(defaultContractId ?? contracts[0]?.id ?? "");

  const contract = contracts.find((c) => c.id === contractId) ?? null;
  const stages = useMemo(() => contract?.stages ?? [], [contract]);
  const [stageId, setStageId] = useState(stages[0]?.id ?? "");
  const [volume, setVolume] = useState("");

  const stage = stages.find((s) => s.id === stageId) ?? stages[0] ?? null;
  const remaining = stage
    ? Math.round((stage.plannedVolumeTonnes - stage.allocatedTonnes) * 100) / 100
    : 0;
  const requested = Number(volume) || 0;
  const exceeds = stage !== null && requested > remaining + 0.01;

  function handleContractChange(nextId: string) {
    setContractId(nextId);
    const next = contracts.find((c) => c.id === nextId);
    setStageId(next?.stages[0]?.id ?? "");
  }

  if (contracts.length === 0) {
    return (
      <CardBody>
        <Alert variant="info" title="Tidak ada kontrak yang dapat diterbitkan DO">
          Delivery Order hanya dapat diterbitkan dari kontrak yang sudah ditandatangani.
        </Alert>
      </CardBody>
    );
  }

  return (
    <form action={formAction}>
      <CardBody className="space-y-4">
        <FormFeedback state={state} />

        <FormGrid>
          <Field
            label="Kontrak"
            htmlFor="contractId"
            required
            error={state.fieldErrors?.contractId}
            className="sm:col-span-2"
          >
            <Select
              id="contractId"
              name="contractId"
              value={contractId}
              onChange={(event) => handleContractChange(event.target.value)}
              required
            >
              {contracts.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Tahap pengiriman"
            htmlFor="stageId"
            required
            error={state.fieldErrors?.stageId}
            className="sm:col-span-2"
          >
            <Select
              id="stageId"
              name="stageId"
              value={stageId}
              onChange={(event) => setStageId(event.target.value)}
              required
            >
              {stages.map((option) => {
                const left =
                  Math.round((option.plannedVolumeTonnes - option.allocatedTonnes) * 100) / 100;
                return (
                  <option key={option.id} value={option.id}>
                    Tahap {option.stageNo} · {formatDateShort(option.periodStart)}–
                    {formatDateShort(option.periodEnd)} · sisa kuota {formatTonnes(left)}
                  </option>
                );
              })}
            </Select>
          </Field>

          <Field
            label="Volume rencana (MT)"
            htmlFor="plannedVolumeTonnes"
            required
            error={state.fieldErrors?.plannedVolumeTonnes}
            hint={stage ? `Sisa kuota tahap ${stage.stageNo}: ${formatTonnes(remaining)}` : undefined}
          >
            <Input
              id="plannedVolumeTonnes"
              name="plannedVolumeTonnes"
              type="number"
              min="1"
              step="1"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              required
            />
          </Field>

          <Field label="Nama kapal / tongkang" htmlFor="vesselName" error={state.fieldErrors?.vesselName}>
            <Input id="vesselName" name="vesselName" placeholder="MV / TB / BG" />
          </Field>

          <Field label="Laycan mulai" htmlFor="laycanStart" error={state.fieldErrors?.laycanStart}>
            <Input id="laycanStart" name="laycanStart" type="date" />
          </Field>

          <Field label="Laycan selesai" htmlFor="laycanEnd" error={state.fieldErrors?.laycanEnd}>
            <Input id="laycanEnd" name="laycanEnd" type="date" />
          </Field>

          <Field label="Titik muat" htmlFor="loadingPoint" error={state.fieldErrors?.loadingPoint}>
            <Input id="loadingPoint" name="loadingPoint" placeholder="Muara Berau Anchorage" />
          </Field>

          <Field label="Tujuan" htmlFor="destination" error={state.fieldErrors?.destination}>
            <Input id="destination" name="destination" placeholder="Fuzhou" />
          </Field>
        </FormGrid>

        {exceeds && stage ? (
          <Alert variant="warning" title="Volume melebihi sisa kuota tahap">
            Rencana tahap {stage.stageNo} adalah {formatTonnes(stage.plannedVolumeTonnes)} dan
            sudah dialokasikan {formatTonnes(stage.allocatedTonnes)}. Sisa kuota{" "}
            {formatTonnes(remaining)}.
          </Alert>
        ) : null}
      </CardBody>

      <CardFooter>
        <FormActions>
          <SubmitButton>Terbitkan Delivery Order</SubmitButton>
          <Button asChild variant="secondary" type="button">
            <Link href="/delivery-order">Batal</Link>
          </Button>
        </FormActions>
      </CardFooter>
    </form>
  );
}
