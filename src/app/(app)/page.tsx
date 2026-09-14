import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarClock, FileSignature } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProgressBar, StatTile } from "@/components/stat-tile";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import {
  getContractProgress,
  getDashboardSummary,
  getOpportunityFunnel,
} from "@/server/repos/dashboard";
import { listApprovalForms } from "@/server/repos/approvals";
import { listUpcomingFollowUps } from "@/server/repos/meeting-notes";
import { OPPORTUNITY_STATUS } from "@/domain/status";
import {
  formatDate,
  formatPercent,
  formatTonnes,
  formatUsdCompact,
  relativeDays,
} from "@/lib/format";
import { PriceStrip } from "./price-strip";

export const metadata = { title: "Dashboard Eksekutif" };

export default async function DashboardPage() {
  const [summary, funnel, progress, approvals, followUps] = await Promise.all([
    getDashboardSummary(),
    getOpportunityFunnel(),
    getContractProgress(),
    listApprovalForms({ status: "menunggu_persetujuan" }),
    listUpcomingFollowUps(5),
  ]);

  const deliveryPercent =
    summary.contractedVolumeTonnes === 0
      ? 0
      : (summary.deliveredVolumeTonnes / summary.contractedVolumeTonnes) * 100;

  return (
    <>
      <PageHeader
        title="Dashboard Eksekutif"
        description="Ringkasan penjualan, persetujuan, kontrak, pengiriman, dan tren harga batubara."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Nilai Pipeline"
          value={formatUsdCompact(summary.pipelineValueUsd)}
          sublabel={`${summary.pipelineCount} opportunity aktif`}
          href="/opportunity?status=on_progress"
        />
        <StatTile
          label="Menunggu Persetujuan"
          value={summary.pendingApprovals}
          sublabel={`Nilai ${formatUsdCompact(summary.pendingApprovalValueUsd)}`}
          href="/persetujuan?status=menunggu_persetujuan"
          tone={summary.pendingApprovals > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Kontrak Ditandatangani Penuh"
          value={summary.fullySignedContracts}
          sublabel={
            summary.contractsAwaitingCounterSignature > 0
              ? `${summary.contractsAwaitingCounterSignature} menunggu tanda tangan pihak kedua`
              : "Seluruh kontrak aktif sudah lengkap"
          }
          href="/kontrak?status=ditandatangani_penuh"
        />
        <StatTile
          label="Realisasi Pengiriman"
          value={formatPercent(deliveryPercent, 1)}
          sublabel={`${formatTonnes(summary.deliveredVolumeTonnes)} dari ${formatTonnes(
            summary.contractedVolumeTonnes
          )}`}
          href="/delivery-order"
        />
      </div>

      <div className="mt-4">
        <Suspense fallback={<PriceStripSkeleton />}>
          <PriceStrip />
        </Suspense>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Perlu Tindakan"
            description="Sales Approval Form yang menunggu keputusan manajemen."
            action={
              <Link
                href="/persetujuan"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                Lihat semua <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {approvals.length === 0 ? (
            <EmptyState
              icon={FileSignature}
              title="Tidak ada persetujuan tertunda"
              description="Seluruh Sales Approval Form sudah diputuskan. Form baru akan muncul di sini begitu diajukan tim marketing."
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Kode</Th>
                    <Th>Buyer / Opportunity</Th>
                    <Th numeric>Volume</Th>
                    <Th numeric>Nilai</Th>
                    <Th>Diajukan</Th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((form) => (
                    <Tr key={form.id}>
                      <Td>
                        <Link
                          href={`/persetujuan/${form.id}`}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {form.code}
                        </Link>
                      </Td>
                      <Td>
                        <p className="font-medium text-ink-900">{form.prospectName}</p>
                        <p className="truncate text-xs text-ink-500">{form.opportunityTitle}</p>
                      </Td>
                      <Td numeric>{formatTonnes(form.proposedVolumeTonnes)}</Td>
                      <Td numeric>{formatUsdCompact(form.proposedValueUsd)}</Td>
                      <Td>
                        <span className="text-ink-600">
                          {form.submittedAt ? relativeDays(form.submittedAt.slice(0, 10)) : "—"}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </Card>

        <Card>
          <CardHeader title="Corong Opportunity" description="Jumlah dan nilai per status." />
          <CardBody className="space-y-3">
            {funnel.map((row) => {
              const meta = OPPORTUNITY_STATUS[row.status];
              const maxValue = Math.max(...funnel.map((f) => f.valueUsd), 1);
              return (
                <div key={row.status}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <StatusBadge meta={meta} />
                    <span className="tnum text-[13px] font-medium text-ink-900">
                      {row.count} · {formatUsdCompact(row.valueUsd)}
                    </span>
                  </div>
                  <ProgressBar
                    percent={(row.valueUsd / maxValue) * 100}
                    tone={row.status === "close" ? "success" : "brand"}
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Realisasi Kontrak"
            description="Rencana versus realisasi tonase, kontrak dengan realisasi terendah di atas."
            action={
              <Link
                href="/kontrak"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                Lihat semua <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {progress.length === 0 ? (
            <EmptyState
              title="Belum ada kontrak aktif"
              description="Kontrak akan muncul di sini setelah Sales Approval Form disetujui dan kontrak dibuat."
            />
          ) : (
            <CardBody className="space-y-4">
              {progress.map((row) => (
                <div key={row.id}>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/kontrak/${row.id}`}
                        className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
                      >
                        {row.contractNumber}
                      </Link>
                      <span className="ml-2 truncate text-[13px] text-ink-500">
                        {row.prospectName}
                      </span>
                    </div>
                    <span className="tnum text-[13px] text-ink-700">
                      {formatTonnes(row.deliveredTonnes)} / {formatTonnes(row.totalVolumeTonnes)}
                      <span className="ml-2 font-semibold text-ink-900">
                        {formatPercent(row.percent, 1)}
                      </span>
                    </span>
                  </div>
                  <ProgressBar percent={row.percent} tone={row.percent >= 100 ? "success" : "brand"} />
                </div>
              ))}
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHeader title="Tindak Lanjut Terdekat" description="Dari catatan meeting." />
          {followUps.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Tidak ada tindak lanjut terjadwal"
              description="Tambahkan catatan meeting dengan tanggal tindak lanjut agar muncul di sini."
            />
          ) : (
            <CardBody className="space-y-3">
              {followUps.map((note) => (
                <div key={note.id} className="border-b border-ink-200/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/prospek/${note.prospectId}`}
                      className="truncate text-[13px] font-medium text-brand-600 hover:text-brand-700"
                    >
                      {note.prospectName}
                    </Link>
                    <Badge tone="info">{relativeDays(note.nextActionDate)}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-ink-600">{note.nextAction}</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {formatDate(note.nextActionDate)} · {note.createdByName}
                  </p>
                </div>
              ))}
            </CardBody>
          )}
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Seluruh angka pada halaman ini berasal dari data sintetis untuk keperluan demonstrasi.
      </p>
    </>
  );
}

function PriceStripSkeleton() {
  return (
    <Card>
      <CardHeader title="Indeks Harga Batubara" />
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
