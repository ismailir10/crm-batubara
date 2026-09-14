import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { listApprovalForms } from "@/server/repos/approvals";
import { getSessionUser } from "@/lib/session";
import { SAF_STATUS, canDecideApproval } from "@/domain/status";
import { formatDateShort, formatPrice, formatTonnes, formatUsdCompact } from "@/lib/format";
import type { SafStatus } from "@/domain/types";

export const metadata = { title: "Persetujuan Penjualan" };

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as SafStatus | "all" | undefined) ?? "all";

  const [forms, user] = await Promise.all([listApprovalForms({ status }), getSessionUser()]);
  const isApprover = user ? canDecideApproval(user.role) : false;
  const pending = forms.filter((f) => f.status === "menunggu_persetujuan").length;

  return (
    <>
      <PageHeader
        title="Persetujuan Penjualan"
        description="Sales Approval Form yang diajukan tim marketing untuk keputusan manajemen."
        action={
          <Button asChild>
            <Link href="/persetujuan/baru">
              <Plus />
              Form Baru
            </Link>
          </Button>
        }
      />

      {isApprover && pending > 0 ? (
        <Alert variant="warning" className="mb-4" title={`${pending} form menunggu keputusan Anda`}>
          Sebagai Manajemen, Anda dapat menyetujui atau menolak form pada halaman detail.
        </Alert>
      ) : null}

      {!isApprover ? (
        <Alert variant="info" className="mb-4">
          Peran Anda dapat membuat dan mengajukan form. Keputusan persetujuan hanya dapat
          dilakukan oleh Manajemen.
        </Alert>
      ) : null}

      <Card>
        <form className="flex flex-wrap items-end gap-3 border-b border-ink-200/70 px-5 py-3">
          <div className="w-56">
            <label htmlFor="status" className="label-caps mb-1 block">
              Status
            </label>
            <Select id="status" name="status" defaultValue={status}>
              <option value="all">Semua status</option>
              {Object.values(SAF_STATUS).map((meta) => (
                <option key={meta.value} value={meta.value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Terapkan
          </Button>
          {status !== "all" ? (
            <Button asChild variant="ghost">
              <Link href="/persetujuan">Reset</Link>
            </Button>
          ) : null}
        </form>

        {forms.length === 0 ? (
          <EmptyState
            title={status === "all" ? "Belum ada form persetujuan" : "Tidak ada form dengan status ini"}
            description={
              status === "all"
                ? "Buat Sales Approval Form dari opportunity yang berpotensi deal untuk meminta persetujuan manajemen."
                : "Pilih status lain untuk melihat form yang tersedia."
            }
            action={
              status === "all" ? (
                <Button asChild>
                  <Link href="/persetujuan/baru">
                    <Plus />
                    Form Baru
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="secondary">
                  <Link href="/persetujuan">Hapus filter</Link>
                </Button>
              )
            }
          />
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Buyer / Opportunity</Th>
                  <Th numeric>Volume</Th>
                  <Th numeric>Harga</Th>
                  <Th numeric>Nilai</Th>
                  <Th>Referensi Indeks</Th>
                  <Th>Status</Th>
                  <Th>Diajukan</Th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
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
                      <p className="line-clamp-1 text-xs text-ink-500">{form.opportunityTitle}</p>
                    </Td>
                    <Td numeric>{formatTonnes(form.proposedVolumeTonnes)}</Td>
                    <Td numeric>{formatPrice(form.proposedPriceUsdPerTonne)}</Td>
                    <Td numeric className="font-medium text-ink-900">
                      {formatUsdCompact(form.proposedValueUsd)}
                    </Td>
                    <Td>
                      {form.refSourceCode ? (
                        <span className="tnum text-xs">
                          <Badge tone="neutral">{form.refSourceCode}</Badge>{" "}
                          {formatPrice(form.refPriceUsdPerTonne)}
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge meta={SAF_STATUS[form.status]} />
                    </Td>
                    <Td>{formatDateShort(form.submittedAt?.slice(0, 10))}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>
    </>
  );
}
