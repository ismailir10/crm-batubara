import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { listDeliveryOrders } from "@/server/repos/delivery-orders";
import { getSessionUser } from "@/lib/session";
import { DO_STATUS, canManageContracts } from "@/domain/status";
import { allocatedTonnes, deliveredTonnes } from "@/domain/calc";
import { formatDateShort, formatTonnes } from "@/lib/format";
import type { DoStatus } from "@/domain/types";

export const metadata = { title: "Delivery Order" };

export default async function DeliveryOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; contractId?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as DoStatus | "all" | undefined) ?? "all";

  const [orders, user] = await Promise.all([
    listDeliveryOrders({ status, contractId: params.contractId }),
    getSessionUser(),
  ]);

  const canManage = user ? canManageContracts(user.role) : false;
  const planned = allocatedTonnes(orders);
  const delivered = deliveredTonnes(orders);

  return (
    <>
      <PageHeader
        title="Delivery Order"
        description="Instruksi pengiriman yang diterbitkan terhadap tahap pengiriman pada kontrak payung."
        action={
          canManage ? (
            <Button asChild>
              <Link href="/delivery-order/baru">
                <Plus />
                Delivery Order Baru
              </Link>
            </Button>
          ) : null
        }
      />

      <Card>
        <form className="flex flex-wrap items-end gap-3 border-b border-ink-200/70 px-5 py-3">
          {params.contractId ? (
            <input type="hidden" name="contractId" value={params.contractId} />
          ) : null}
          <div className="w-56">
            <label htmlFor="status" className="label-caps mb-1 block">
              Status
            </label>
            <Select id="status" name="status" defaultValue={status}>
              <option value="all">Semua status</option>
              {Object.values(DO_STATUS).map((meta) => (
                <option key={meta.value} value={meta.value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Terapkan
          </Button>
          {status !== "all" || params.contractId ? (
            <Button asChild variant="ghost">
              <Link href="/delivery-order">Reset</Link>
            </Button>
          ) : null}
        </form>

        {orders.length === 0 ? (
          <EmptyState
            title="Belum ada Delivery Order"
            description="Delivery Order diterbitkan dari halaman kontrak terhadap tahap pengiriman tertentu."
            action={
              <Button asChild variant="secondary">
                <Link href="/kontrak">Buka daftar kontrak</Link>
              </Button>
            }
          />
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Nomor DO</Th>
                  <Th>Kontrak / Buyer</Th>
                  <Th>Tahap</Th>
                  <Th numeric>Rencana</Th>
                  <Th numeric>Aktual</Th>
                  <Th>Laycan</Th>
                  <Th>Tujuan</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      <Link
                        href={`/delivery-order/${order.id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {order.doNumber}
                      </Link>
                    </Td>
                    <Td>
                      <Link
                        href={`/kontrak/${order.contractId}`}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        {order.contractNumber}
                      </Link>
                      <span className="block text-xs text-ink-500">{order.prospectName}</span>
                    </Td>
                    <Td>Tahap {order.stageNo}</Td>
                    <Td numeric>{formatTonnes(order.plannedVolumeTonnes)}</Td>
                    <Td numeric className="font-medium text-ink-900">
                      {order.actualVolumeTonnes === null
                        ? "—"
                        : formatTonnes(order.actualVolumeTonnes)}
                    </Td>
                    <Td>
                      <span className="text-xs">
                        {formatDateShort(order.laycanStart)} — {formatDateShort(order.laycanEnd)}
                      </span>
                    </Td>
                    <Td>{order.destination ?? "—"}</Td>
                    <Td>
                      <StatusBadge meta={DO_STATUS[order.status]} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      <p className="mt-3 text-xs text-ink-400">
        {orders.length} DO · rencana {formatTonnes(planned)} · terkirim {formatTonnes(delivered)}
      </p>
    </>
  );
}
