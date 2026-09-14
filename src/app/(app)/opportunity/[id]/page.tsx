import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { DataItem } from "@/components/ui/form";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { getOpportunity, getOpportunityHistory } from "@/server/repos/opportunities";
import { getApprovalFormByOpportunity } from "@/server/repos/approvals";
import { listMeetingNotesByOpportunity } from "@/server/repos/meeting-notes";
import { OPPORTUNITY_STATUS, SAF_STATUS } from "@/domain/status";
import {
  formatDate,
  formatDateTime,
  formatIdrEquivalent,
  formatPrice,
  formatTonnes,
  formatUsd,
} from "@/lib/format";
import { MeetingNoteForm } from "../../prospek/[id]/meeting-note-form";
import { OpportunityStatusForm } from "./status-form";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) notFound();

  const [history, approval, notes] = await Promise.all([
    getOpportunityHistory(id),
    getApprovalFormByOpportunity(id),
    listMeetingNotesByOpportunity(id),
  ]);

  const specs = [
    opportunity.coalGarKcal ? `GAR ${opportunity.coalGarKcal} kcal/kg` : null,
    opportunity.coalTmPct ? `TM ${opportunity.coalTmPct}%` : null,
    opportunity.coalAshPct ? `Ash ${opportunity.coalAshPct}%` : null,
    opportunity.coalSulphurPct ? `Sulphur ${opportunity.coalSulphurPct}%` : null,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title={opportunity.title}
        description={`${opportunity.code} · ${opportunity.prospectName}`}
        breadcrumbs={[
          { label: "Opportunity", href: "/opportunity" },
          { label: opportunity.code },
        ]}
        action={
          !approval ? (
            <Button asChild>
              <Link href={`/persetujuan/baru?opportunityId=${opportunity.id}`}>
                <FileCheck2 />
                Buat Sales Approval Form
              </Link>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <Link href={`/persetujuan/${approval.id}`}>
                Lihat {approval.code}
                <ArrowRight />
              </Link>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Ringkasan Komersial" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <DataItem label="Estimasi volume">
                  <span className="tnum font-semibold">
                    {formatTonnes(opportunity.estimatedVolumeTonnes)}
                  </span>
                </DataItem>
                <DataItem label="Harga indikatif">
                  <span className="tnum font-semibold">
                    {formatPrice(opportunity.estimatedPriceUsdPerTonne)}
                  </span>
                  <span className="text-xs text-ink-500"> USD/MT</span>
                </DataItem>
                <DataItem label="Estimasi nilai">
                  <span className="tnum font-semibold">
                    {formatUsd(opportunity.estimatedValueUsd, 0)}
                  </span>
                  <span className="block text-xs text-ink-500">
                    {formatIdrEquivalent(opportunity.estimatedValueUsd)}
                  </span>
                </DataItem>
                <DataItem label="Delivery term">{opportunity.deliveryTerm}</DataItem>
              </dl>

              {specs.length > 0 ? (
                <div className="mt-4 border-t border-ink-200/70 pt-4">
                  <p className="label-caps mb-1.5">Spesifikasi</p>
                  <p className="text-[13px] text-ink-700">{specs.join(" · ")}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {approval ? (
            <Card>
              <CardHeader
                title="Sales Approval Form"
                description="Pengajuan persetujuan penjualan untuk opportunity ini."
                action={
                  <Link
                    href={`/persetujuan/${approval.id}`}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
                  >
                    Buka <ArrowRight className="size-3.5" />
                  </Link>
                }
              />
              <CardBody>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <DataItem label="Kode">{approval.code}</DataItem>
                  <DataItem label="Status">
                    <StatusBadge meta={SAF_STATUS[approval.status]} />
                  </DataItem>
                  <DataItem label="Harga diajukan">
                    <span className="tnum">
                      {formatPrice(approval.proposedPriceUsdPerTonne)} USD/MT
                    </span>
                  </DataItem>
                  <DataItem label="Keputusan">
                    {approval.decidedByName ? (
                      <>
                        {approval.decidedByName}
                        <span className="block text-xs text-ink-500">
                          {formatDate(approval.decidedAt?.slice(0, 10))}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </DataItem>
                </dl>

                {approval.decisionNote ? (
                  <Alert
                    variant={approval.status === "ditolak" ? "danger" : "success"}
                    className="mt-4"
                  >
                    {approval.decisionNote}
                  </Alert>
                ) : null}

                {approval.contractId ? (
                  <div className="mt-4">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/kontrak/${approval.contractId}`}>
                        Lihat kontrak
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                ) : approval.status === "disetujui" ? (
                  <div className="mt-4">
                    <Button asChild size="sm">
                      <Link href={`/kontrak/baru?safId=${approval.id}`}>
                        Buat kontrak
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Catatan Meeting" description="Notulensi terkait opportunity ini." />
            <CardBody className="space-y-4">
              <MeetingNoteForm
                prospectId={opportunity.prospectId}
                opportunityId={opportunity.id}
              />

              {notes.length === 0 ? (
                <EmptyState
                  title="Belum ada catatan meeting"
                  description="Tambahkan notulensi agar riwayat negosiasi tercatat pada opportunity ini."
                />
              ) : (
                <ol className="space-y-4">
                  {notes.map((note) => (
                    <li key={note.id} className="border-l-2 border-ink-200 pl-4">
                      <p className="text-[13px] font-semibold text-ink-900">
                        {formatDate(note.meetingDate)}
                        {note.location ? (
                          <span className="ml-2 font-normal text-ink-500">{note.location}</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">Peserta: {note.attendees}</p>
                      <p className="mt-2 text-[13px] whitespace-pre-line text-ink-700">
                        {note.summary}
                      </p>
                      {note.nextAction ? (
                        <p className="mt-2 rounded-md bg-info-soft px-3 py-2 text-[13px] text-info-ink">
                          <span className="font-semibold">Tindak lanjut:</span> {note.nextAction}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Status" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge meta={OPPORTUNITY_STATUS[opportunity.status]} />
                <span className="text-xs text-ink-500">
                  {OPPORTUNITY_STATUS[opportunity.status].description}
                </span>
              </div>

              <OpportunityStatusForm
                opportunityId={opportunity.id}
                currentStatus={opportunity.status}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Informasi" />
            <CardBody>
              <dl className="space-y-3.5">
                <DataItem label="Prospek">
                  <Link
                    href={`/prospek/${opportunity.prospectId}`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {opportunity.prospectName}
                  </Link>
                </DataItem>
                <DataItem label="Pemilik">{opportunity.ownerName}</DataItem>
                <DataItem label="Target close">
                  {formatDate(opportunity.expectedCloseDate)}
                </DataItem>
                <DataItem label="Dibuat">{formatDate(opportunity.createdAt.slice(0, 10))}</DataItem>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Riwayat Status" description="Setiap perubahan beserta alasannya." />
            <CardBody>
              <ol className="space-y-3.5">
                {history.map((entry) => (
                  <li key={entry.id} className="border-l-2 border-ink-200 pl-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {entry.fromStatus ? (
                        <>
                          <span className="text-xs text-ink-500">
                            {OPPORTUNITY_STATUS[entry.fromStatus].label}
                          </span>
                          <ArrowRight className="size-3 text-ink-300" />
                        </>
                      ) : null}
                      <StatusBadge meta={OPPORTUNITY_STATUS[entry.toStatus]} dot={false} />
                    </div>
                    <p className="mt-1 text-[13px] text-ink-700">{entry.reason}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {entry.changedByName} · {formatDateTime(entry.changedAt)}
                    </p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
