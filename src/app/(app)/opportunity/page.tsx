import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { listOpportunities } from "@/server/repos/opportunities";
import { OPPORTUNITY_STATUS } from "@/domain/status";
import { formatDateShort, formatPrice, formatTonnes, formatUsdCompact } from "@/lib/format";
import type { OpportunityStatus } from "@/domain/types";

export const metadata = { title: "Opportunity" };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const status = (params.status as OpportunityStatus | "all" | undefined) ?? "all";

  const opportunities = await listOpportunities({ search, status });
  const filtered = Boolean(search) || status !== "all";
  const totalValue = opportunities.reduce((sum, o) => sum + o.estimatedValueUsd, 0);

  return (
    <>
      <PageHeader
        title="Opportunity"
        description="Potensi transaksi penjualan batubara beserta status dan estimasi nilainya."
        action={
          <Button asChild>
            <Link href="/opportunity/baru">
              <Plus />
              Opportunity Baru
            </Link>
          </Button>
        }
      />

      <Card>
        <form className="flex flex-wrap items-end gap-3 border-b border-ink-200/70 px-5 py-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="q" className="label-caps mb-1 block">
              Cari
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-ink-400" />
              <Input
                id="q"
                name="q"
                defaultValue={search}
                placeholder="Judul, kode, atau nama buyer"
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-52">
            <label htmlFor="status" className="label-caps mb-1 block">
              Status
            </label>
            <Select id="status" name="status" defaultValue={status}>
              <option value="all">Semua status</option>
              {Object.values(OPPORTUNITY_STATUS).map((meta) => (
                <option key={meta.value} value={meta.value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Terapkan
          </Button>
          {filtered ? (
            <Button asChild variant="ghost">
              <Link href="/opportunity">Reset</Link>
            </Button>
          ) : null}
        </form>

        {opportunities.length === 0 ? (
          <EmptyState
            title={filtered ? "Tidak ada opportunity yang cocok" : "Belum ada opportunity"}
            description={
              filtered
                ? "Ubah kata kunci atau filter status untuk melihat hasil lain."
                : "Buat opportunity dari prospek yang sudah terkualifikasi untuk mulai melacak potensi transaksi."
            }
            action={
              filtered ? (
                <Button asChild variant="secondary">
                  <Link href="/opportunity">Hapus filter</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/opportunity/baru">
                    <Plus />
                    Opportunity Baru
                  </Link>
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
                  <Th>Opportunity</Th>
                  <Th numeric>Volume</Th>
                  <Th numeric>Harga</Th>
                  <Th numeric>Nilai</Th>
                  <Th>Status</Th>
                  <Th>Target Close</Th>
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
                      <p className="line-clamp-1 font-medium text-ink-900">{opportunity.title}</p>
                      <p className="text-xs text-ink-500">
                        {opportunity.prospectName} · {opportunity.deliveryTerm}
                      </p>
                    </Td>
                    <Td numeric>{formatTonnes(opportunity.estimatedVolumeTonnes)}</Td>
                    <Td numeric>{formatPrice(opportunity.estimatedPriceUsdPerTonne)}</Td>
                    <Td numeric className="font-medium text-ink-900">
                      {formatUsdCompact(opportunity.estimatedValueUsd)}
                    </Td>
                    <Td>
                      <StatusBadge meta={OPPORTUNITY_STATUS[opportunity.status]} />
                    </Td>
                    <Td>{formatDateShort(opportunity.expectedCloseDate)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      <p className="mt-3 text-xs text-ink-400">
        {opportunities.length} opportunity · total nilai {formatUsdCompact(totalValue)} · data sintetis
      </p>
    </>
  );
}
