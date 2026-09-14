import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { StatusBadge } from "@/components/ui/badge";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { ProgressBar } from "@/components/stat-tile";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { listContracts } from "@/server/repos/contracts";
import { listApprovedFormsWithoutContract } from "@/server/repos/approvals";
import { CONTRACT_STATUS } from "@/domain/status";
import { formatDateShort, formatPercent, formatTonnes, formatUsdCompact } from "@/lib/format";
import type { ContractStatus } from "@/domain/types";

export const metadata = { title: "Kontrak" };

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as ContractStatus | "all" | undefined) ?? "all";

  const [contracts, readyForms] = await Promise.all([
    listContracts({ status }),
    listApprovedFormsWithoutContract(),
  ]);

  return (
    <>
      <PageHeader
        title="Kontrak"
        description="Kontrak payung penjualan batubara beserta status penandatanganan dan realisasi pengiriman."
        action={
          readyForms.length > 0 ? (
            <Button asChild>
              <Link href={`/kontrak/baru?safId=${readyForms[0].id}`}>
                <Plus />
                Kontrak Baru
              </Link>
            </Button>
          ) : null
        }
      />

      {readyForms.length > 0 ? (
        <Alert
          variant="info"
          className="mb-4"
          title={`${readyForms.length} form persetujuan siap dikontrakkan`}
        >
          {readyForms.map((form) => (
            <Link
              key={form.id}
              href={`/kontrak/baru?safId=${form.id}`}
              className="mr-3 font-medium underline underline-offset-2"
            >
              {form.code} — {form.prospectName}
            </Link>
          ))}
        </Alert>
      ) : null}

      <Card>
        <form className="flex flex-wrap items-end gap-3 border-b border-ink-200/70 px-5 py-3">
          <div className="w-64">
            <label htmlFor="status" className="label-caps mb-1 block">
              Status
            </label>
            <Select id="status" name="status" defaultValue={status}>
              <option value="all">Semua status</option>
              {Object.values(CONTRACT_STATUS).map((meta) => (
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
              <Link href="/kontrak">Reset</Link>
            </Button>
          ) : null}
        </form>

        {contracts.length === 0 ? (
          <EmptyState
            title={status === "all" ? "Belum ada kontrak" : "Tidak ada kontrak dengan status ini"}
            description={
              status === "all"
                ? "Kontrak dibuat dari Sales Approval Form yang sudah disetujui manajemen."
                : "Pilih status lain untuk melihat kontrak yang tersedia."
            }
            action={
              status !== "all" ? (
                <Button asChild variant="secondary">
                  <Link href="/kontrak">Hapus filter</Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Nomor</Th>
                  <Th>Buyer</Th>
                  <Th numeric>Volume</Th>
                  <Th numeric>Harga</Th>
                  <Th numeric>Nilai</Th>
                  <Th>Realisasi</Th>
                  <Th>Status</Th>
                  <Th>Periode</Th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const percent =
                    contract.totalVolumeTonnes === 0
                      ? 0
                      : (contract.deliveredTonnes / contract.totalVolumeTonnes) * 100;
                  return (
                    <Tr key={contract.id}>
                      <Td>
                        <Link
                          href={`/kontrak/${contract.id}`}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {contract.contractNumber}
                        </Link>
                      </Td>
                      <Td>
                        <p className="font-medium text-ink-900">{contract.prospectName}</p>
                        <p className="line-clamp-1 text-xs text-ink-500">{contract.title}</p>
                      </Td>
                      <Td numeric>{formatTonnes(contract.totalVolumeTonnes)}</Td>
                      <Td numeric>{contract.priceUsdPerTonne.toFixed(2)}</Td>
                      <Td numeric className="font-medium text-ink-900">
                        {formatUsdCompact(
                          contract.totalVolumeTonnes * contract.priceUsdPerTonne
                        )}
                      </Td>
                      <Td>
                        <div className="w-28">
                          <div className="tnum mb-1 text-xs text-ink-600">
                            {formatPercent(percent, 1)}
                          </div>
                          <ProgressBar
                            percent={percent}
                            tone={percent >= 100 ? "success" : "brand"}
                          />
                        </div>
                      </Td>
                      <Td>
                        <StatusBadge meta={CONTRACT_STATUS[contract.status]} />
                      </Td>
                      <Td>
                        <span className="text-xs">
                          {formatDateShort(contract.periodStart)} —{" "}
                          {formatDateShort(contract.periodEnd)}
                        </span>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>
    </>
  );
}
