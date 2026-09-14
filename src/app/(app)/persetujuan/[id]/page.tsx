import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DataItem } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { getApprovalForm } from "@/server/repos/approvals";
import { getSessionUser } from "@/lib/session";
import { SAF_STATUS, canDecideApproval } from "@/domain/status";
import {
  formatDate,
  formatDateTime,
  formatIdrEquivalent,
  formatPrice,
  formatTonnes,
  formatUsd,
} from "@/lib/format";
import { DecisionForm, SubmitForApprovalForm } from "./decision-form";

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [form, user] = await Promise.all([getApprovalForm(id), getSessionUser()]);
  if (!form) notFound();

  const isApprover = user ? canDecideApproval(user.role) : false;
  const awaitingDecision = form.status === "menunggu_persetujuan";
  const isDraft = form.status === "draft" || form.status === "perlu_revisi";

  const spread =
    form.refPriceUsdPerTonne !== null
      ? form.proposedPriceUsdPerTonne - form.refPriceUsdPerTonne
      : null;

  return (
    <>
      <PageHeader
        title={form.code}
        description={`${form.prospectName} · ${form.opportunityTitle}`}
        breadcrumbs={[
          { label: "Persetujuan Penjualan", href: "/persetujuan" },
          { label: form.code },
        ]}
        action={
          <Button asChild variant="secondary">
            <Link href={`/opportunity/${form.opportunityId}`}>
              Lihat Opportunity
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Usulan Komersial" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <DataItem label="Volume">
                  <span className="tnum font-semibold">
                    {formatTonnes(form.proposedVolumeTonnes)}
                  </span>
                </DataItem>
                <DataItem label="Harga">
                  <span className="tnum font-semibold">
                    {formatPrice(form.proposedPriceUsdPerTonne)}
                  </span>
                  <span className="text-xs text-ink-500"> USD/MT</span>
                </DataItem>
                <DataItem label="Nilai kontrak">
                  <span className="tnum font-semibold">{formatUsd(form.proposedValueUsd, 0)}</span>
                  <span className="block text-xs text-ink-500">
                    {formatIdrEquivalent(form.proposedValueUsd)}
                  </span>
                </DataItem>
                <DataItem label="Delivery term">{form.deliveryTerm}</DataItem>
                <DataItem label="Term pembayaran" className="sm:col-span-2">
                  {form.paymentTerm}
                </DataItem>
                <DataItem label="Periode kontrak" className="sm:col-span-2">
                  {form.contractPeriodStart ? (
                    <>
                      {formatDate(form.contractPeriodStart)} — {formatDate(form.contractPeriodEnd)}
                    </>
                  ) : (
                    "—"
                  )}
                </DataItem>
              </dl>
            </CardBody>
          </Card>

          {/* The frozen market reference — the link between price intelligence
              and the commercial decision (specification §9.5). */}
          <Card>
            <CardHeader
              title="Referensi Harga Pasar"
              description="Nilai indeks yang dikunci pada saat form diajukan."
              action={
                <Badge tone="warning">
                  <Lock className="size-3" />
                  Terkunci
                </Badge>
              }
            />
            <CardBody>
              {form.refSourceCode ? (
                <>
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <DataItem label="Sumber indeks">
                      <span className="font-semibold">{form.refSourceCode}</span>
                      <span className="block text-xs text-ink-500">{form.refSourceName}</span>
                    </DataItem>
                    <DataItem label="Harga indeks">
                      <span className="tnum font-semibold">
                        {formatPrice(form.refPriceUsdPerTonne)}
                      </span>
                      <span className="text-xs text-ink-500"> USD/MT</span>
                    </DataItem>
                    <DataItem label="Tanggal observasi">
                      {formatDate(form.refObservationDate)}
                    </DataItem>
                    <DataItem label="Selisih usulan">
                      {spread === null ? (
                        "—"
                      ) : (
                        <span
                          className={
                            spread >= 0
                              ? "tnum font-semibold text-success-ink"
                              : "tnum font-semibold text-danger-ink"
                          }
                        >
                          {spread >= 0 ? "+" : "−"}
                          {formatPrice(Math.abs(spread))} USD/MT
                        </span>
                      )}
                    </DataItem>
                  </dl>
                  <p className="mt-3 text-xs text-ink-400">
                    Nilai ini tidak berubah meskipun harga indeks bergerak setelah pengajuan.
                    Seluruh data harga bersifat sintetis.
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-ink-500">
                  Form ini diajukan tanpa referensi indeks harga.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Justifikasi" />
            <CardBody>
              <p className="text-[13px] whitespace-pre-line text-ink-700">{form.justification}</p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Status Persetujuan" />
            <CardBody className="space-y-4">
              <StatusBadge meta={SAF_STATUS[form.status]} />

              <dl className="space-y-3.5">
                <DataItem label="Diajukan oleh">
                  {form.submittedByName ?? "—"}
                  {form.submittedAt ? (
                    <span className="block text-xs text-ink-500">
                      {formatDateTime(form.submittedAt)}
                    </span>
                  ) : null}
                </DataItem>
                {form.decidedByName ? (
                  <DataItem label="Diputuskan oleh">
                    {form.decidedByName}
                    <span className="block text-xs text-ink-500">
                      {formatDateTime(form.decidedAt)}
                    </span>
                  </DataItem>
                ) : null}
              </dl>

              {form.decisionNote ? (
                <Alert variant={form.status === "ditolak" ? "danger" : "success"}>
                  {form.decisionNote}
                </Alert>
              ) : null}

              {awaitingDecision && isApprover ? <DecisionForm safId={form.id} /> : null}

              {awaitingDecision && !isApprover ? (
                <Alert variant="info">
                  Menunggu keputusan Manajemen. Peran Anda tidak dapat menyetujui atau menolak
                  form ini.
                </Alert>
              ) : null}

              {isDraft ? <SubmitForApprovalForm safId={form.id} /> : null}

              {form.status === "disetujui" ? (
                form.contractId ? (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/kontrak/${form.contractId}`}>
                      Lihat Kontrak
                      <ArrowRight />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={`/kontrak/baru?safId=${form.id}`}>
                      Buat Kontrak
                      <ArrowRight />
                    </Link>
                  </Button>
                )
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tautan" />
            <CardBody>
              <dl className="space-y-3.5">
                <DataItem label="Opportunity">
                  <Link
                    href={`/opportunity/${form.opportunityId}`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {form.opportunityCode}
                  </Link>
                </DataItem>
                <DataItem label="Buyer">{form.prospectName}</DataItem>
                <DataItem label="Dibuat">{formatDate(form.createdAt.slice(0, 10))}</DataItem>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
