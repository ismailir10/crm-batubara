import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { listProspects } from "@/server/repos/prospects";
import { PROSPECT_STATUS } from "@/domain/status";
import { formatDateShort } from "@/lib/format";
import type { ProspectStatus } from "@/domain/types";

export const metadata = { title: "Prospek" };

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const status = (params.status as ProspectStatus | "all" | undefined) ?? "all";

  const prospects = await listProspects({ search, status });
  const filtered = Boolean(search) || status !== "all";

  return (
    <>
      <PageHeader
        title="Prospek"
        description="Daftar calon pembeli batubara beserta status kualifikasinya."
        action={
          <Button asChild>
            <Link href="/prospek/baru">
              <Plus />
              Prospek Baru
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
                placeholder="Nama perusahaan, kode, atau kontak"
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
              {Object.values(PROSPECT_STATUS).map((meta) => (
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
              <Link href="/prospek">Reset</Link>
            </Button>
          ) : null}
        </form>

        {prospects.length === 0 ? (
          <EmptyState
            title={filtered ? "Tidak ada prospek yang cocok" : "Belum ada prospek"}
            description={
              filtered
                ? "Ubah kata kunci atau filter status untuk melihat hasil lain."
                : "Tambahkan prospek pertama untuk mulai mencatat calon pembeli dan hasil pertemuan."
            }
            action={
              filtered ? (
                <Button asChild variant="secondary">
                  <Link href="/prospek">Hapus filter</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/prospek/baru">
                    <Plus />
                    Prospek Baru
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
                  <Th>Perusahaan</Th>
                  <Th>Negara</Th>
                  <Th>Kontak</Th>
                  <Th>Status</Th>
                  <Th>Pemilik</Th>
                  <Th>Dibuat</Th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <Tr key={prospect.id}>
                    <Td>
                      <Link
                        href={`/prospek/${prospect.id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {prospect.code}
                      </Link>
                    </Td>
                    <Td>
                      <p className="font-medium text-ink-900">{prospect.companyName}</p>
                      {prospect.city ? (
                        <p className="text-xs text-ink-500">{prospect.city}</p>
                      ) : null}
                    </Td>
                    <Td>{prospect.country}</Td>
                    <Td>
                      {prospect.contactPerson ? (
                        <>
                          <p>{prospect.contactPerson}</p>
                          <p className="text-xs text-ink-500">{prospect.contactRole}</p>
                        </>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge meta={PROSPECT_STATUS[prospect.status]} />
                    </Td>
                    <Td>{prospect.ownerName}</Td>
                    <Td>{formatDateShort(prospect.createdAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      <p className="mt-3 text-xs text-ink-400">
        {prospects.length} prospek ditampilkan · seluruh data bersifat sintetis
      </p>
    </>
  );
}
