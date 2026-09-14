import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { DataItem } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { getProspect } from "@/server/repos/prospects";
import { listOpportunities } from "@/server/repos/opportunities";
import { listMeetingNotesByProspect } from "@/server/repos/meeting-notes";
import { OPPORTUNITY_STATUS, PROSPECT_STATUS } from "@/domain/status";
import { formatDate, formatDateShort, formatTonnes, formatUsdCompact } from "@/lib/format";
import { MeetingNoteForm } from "./meeting-note-form";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospect = await getProspect(id);
  if (!prospect) notFound();

  const [opportunities, notes] = await Promise.all([
    listOpportunities({ prospectId: id }),
    listMeetingNotesByProspect(id),
  ]);

  return (
    <>
      <PageHeader
        title={prospect.companyName}
        description={`${prospect.code} · ${prospect.country}${prospect.city ? ` · ${prospect.city}` : ""}`}
        breadcrumbs={[{ label: "Prospek", href: "/prospek" }, { label: prospect.code }]}
        action={
          <>
            <Button asChild variant="secondary">
              <Link href={`/prospek/${prospect.id}/ubah`}>Ubah</Link>
            </Button>
            <Button asChild>
              <Link href={`/opportunity/baru?prospectId=${prospect.id}`}>
                <Plus />
                Opportunity Baru
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="Opportunity"
              description={`${opportunities.length} opportunity terkait prospek ini.`}
            />
            {opportunities.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Belum ada opportunity"
                description="Buat opportunity untuk mulai melacak potensi transaksi dengan pembeli ini."
                action={
                  <Button asChild size="sm">
                    <Link href={`/opportunity/baru?prospectId=${prospect.id}`}>
                      <Plus />
                      Opportunity Baru
                    </Link>
                  </Button>
                }
              />
            ) : (
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <Th>Kode</Th>
                      <Th>Judul</Th>
                      <Th numeric>Volume</Th>
                      <Th numeric>Nilai</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opportunity) => (
                      <Tr key={opportunity.id}>
                        <Td>
                          <Link
                            href={`/opportunity/${opportunity.id}`}
                            className="font-medium text-brand-600 hover:text-brand-700"
                          >
                            {opportunity.code}
                          </Link>
                        </Td>
                        <Td>
                          <span className="line-clamp-1">{opportunity.title}</span>
                        </Td>
                        <Td numeric>{formatTonnes(opportunity.estimatedVolumeTonnes)}</Td>
                        <Td numeric>{formatUsdCompact(opportunity.estimatedValueUsd)}</Td>
                        <Td>
                          <StatusBadge meta={OPPORTUNITY_STATUS[opportunity.status]} />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrapper>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Catatan Meeting"
              description="Notulensi setiap pertemuan dengan calon pembeli."
            />
            <CardBody className="space-y-4">
              <MeetingNoteForm
                prospectId={prospect.id}
                opportunityOptions={opportunities.map((o) => ({
                  id: o.id,
                  label: `${o.code} — ${o.title}`,
                }))}
              />

              {notes.length === 0 ? (
                <EmptyState
                  title="Belum ada catatan meeting"
                  description="Catat hasil pertemuan agar riwayat diskusi dan tindak lanjut tidak hilang."
                />
              ) : (
                <ol className="space-y-4">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="border-l-2 border-ink-200 pl-4 last:pb-0"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[13px] font-semibold text-ink-900">
                          {formatDate(note.meetingDate)}
                          {note.location ? (
                            <span className="ml-2 font-normal text-ink-500">{note.location}</span>
                          ) : null}
                        </p>
                        {note.opportunityCode ? (
                          <Link
                            href={`/opportunity/${note.opportunityId}`}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            {note.opportunityCode}
                          </Link>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-500">Peserta: {note.attendees}</p>
                      <p className="mt-2 text-[13px] whitespace-pre-line text-ink-700">
                        {note.summary}
                      </p>
                      {note.nextAction ? (
                        <p className="mt-2 rounded-md bg-info-soft px-3 py-2 text-[13px] text-info-ink">
                          <span className="font-semibold">Tindak lanjut:</span> {note.nextAction}
                          {note.nextActionDate ? (
                            <span className="text-info-ink/80">
                              {" "}
                              · {formatDate(note.nextActionDate)}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-xs text-ink-400">Dicatat oleh {note.createdByName}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Informasi Prospek" />
            <CardBody>
              <dl className="space-y-3.5">
                <DataItem label="Status">
                  <StatusBadge meta={PROSPECT_STATUS[prospect.status]} />
                </DataItem>
                <DataItem label="Kontak">
                  {prospect.contactPerson ?? "—"}
                  {prospect.contactRole ? (
                    <span className="block text-xs text-ink-500">{prospect.contactRole}</span>
                  ) : null}
                </DataItem>
                {prospect.contactEmail ? (
                  <DataItem label="Email">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5 text-ink-400" />
                      {prospect.contactEmail}
                    </span>
                  </DataItem>
                ) : null}
                {prospect.contactPhone ? (
                  <DataItem label="Telepon">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 text-ink-400" />
                      {prospect.contactPhone}
                    </span>
                  </DataItem>
                ) : null}
                <DataItem label="Sumber">{prospect.source ?? "—"}</DataItem>
                <DataItem label="Pemilik">{prospect.ownerName}</DataItem>
                <DataItem label="Dibuat">{formatDateShort(prospect.createdAt)}</DataItem>
              </dl>
            </CardBody>
          </Card>

          {prospect.notes ? (
            <Card>
              <CardHeader title="Catatan" />
              <CardBody>
                <p className="text-[13px] whitespace-pre-line text-ink-700">{prospect.notes}</p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
