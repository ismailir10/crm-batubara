import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Plus, Ship } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { DataItem } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { ProgressBar } from "@/components/stat-tile";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { getContract, listStages } from "@/server/repos/contracts";
import { listDeliveryOrders } from "@/server/repos/delivery-orders";
import { getSessionUser } from "@/lib/session";
import { CONTRACT_STATUS, DO_STATUS, canManageContracts } from "@/domain/status";
import { progress } from "@/domain/calc";
import {
  formatDate,
  formatDateShort,
  formatIdrEquivalent,
  formatPercent,
  formatPrice,
  formatTonnes,
  formatUsd,
} from "@/lib/format";
import { ContractStatusForm } from "./contract-status-form";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);
  if (!contract) notFound();

  const [stages, orders, user] = await Promise.all([
    listStages(id),
    listDeliveryOrders({ contractId: id }),
    getSessionUser(),
  ]);

  const canManage = user ? canManageContracts(user.role) : false;
  const overall = progress(contract.totalVolumeTonnes, contract.deliveredTonnes);
  const contractValue = contract.totalVolumeTonnes * contract.priceUsdPerTonne;
  const canIssueDo =
    contract.status === "ditandatangani_penuh" || contract.status === "ditandatangani_satu_pihak";

  return (
    <>
      <PageHeader
        title={contract.contractNumber}
        description={`${contract.prospectName} · ${contract.title}`}
        breadcrumbs={[{ label: "Kontrak", href: "/kontrak" }, { label: contract.contractNumber }]}
        action={
          canManage && canIssueDo ? (
            <Button asChild>
              <Link href={`/delivery-order/baru?contractId=${contract.id}`}>
                <Plus />
                Delivery Order Baru
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="Realisasi Pengiriman"
              description="Rencana versus realisasi tonase untuk seluruh kontrak."
            />
            <CardBody>
              <div className="mb-4">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="tnum text-2xl font-semibold text-ink-900">
                    {formatPercent(overall.percent, 1)}
                  </span>
                  <span className="tnum text-[13px] text-ink-600">
                    {formatTonnes(overall.delivered)} dari {formatTonnes(overall.planned)}
                  </span>
                </div>
                <ProgressBar
                  percent={overall.percent}
                  tone={overall.percent >= 100 ? "success" : "brand"}
                />
                <p className="mt-1.5 text-xs text-ink-500">
                  Sisa {formatTonnes(overall.remaining)} belum dikirim.
                </p>
              </div>

              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <Th>Tahap</Th>
                      <Th>Periode</Th>
                      <Th numeric>Rencana</Th>
                      <Th numeric>Dialokasikan</Th>
                      <Th numeric>Terkirim</Th>
                      <Th>Progres</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((stage) => {
                      const stageProgress = progress(
                        stage.plannedVolumeTonnes,
                        stage.deliveredTonnes
                      );
                      const unallocated =
                        Math.round((stage.plannedVolumeTonnes - stage.allocatedTonnes) * 100) / 100;
                      return (
                        <Tr key={stage.id}>
                          <Td>
                            <span className="font-medium text-ink-900">Tahap {stage.stageNo}</span>
                            {stage.notes ? (
                              <span className="block text-xs text-ink-500">{stage.notes}</span>
                            ) : null}
                          </Td>
                          <Td>
                            <span className="text-xs">
                              {formatDateShort(stage.periodStart)} —{" "}
                              {formatDateShort(stage.periodEnd)}
                            </span>
                          </Td>
                          <Td numeric>{formatTonnes(stage.plannedVolumeTonnes)}</Td>
                          <Td numeric>
                            {formatTonnes(stage.allocatedTonnes)}
                            {unallocated > 0 ? (
                              <span className="block text-xs text-ink-500">
                                sisa kuota {formatTonnes(unallocated)}
                              </span>
                            ) : null}
                          </Td>
                          <Td numeric className="font-medium text-ink-900">
                            {formatTonnes(stage.deliveredTonnes)}
                          </Td>
                          <Td>
                            <div className="w-24">
                              <div className="tnum mb-1 text-xs text-ink-600">
                                {formatPercent(stageProgress.percent, 0)}
                              </div>
                              <ProgressBar
                                percent={stageProgress.percent}
                                tone={stageProgress.percent >= 100 ? "success" : "brand"}
                              />
                            </div>
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrapper>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Delivery Order"
              description={`${orders.length} DO diterbitkan dari kontrak ini.`}
              action={
                <Link
                  href={`/delivery-order?contractId=${contract.id}`}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
                >
                  Lihat semua <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            {orders.length === 0 ? (
              <EmptyState
                icon={Ship}
                title="Belum ada Delivery Order"
                description={
                  canIssueDo
                    ? "Terbitkan Delivery Order terhadap salah satu tahap pengiriman untuk mulai mencatat realisasi."
                    : "Delivery Order dapat diterbitkan setelah kontrak ditandatangani."
                }
                action={
                  canManage && canIssueDo ? (
                    <Button asChild size="sm">
                      <Link href={`/delivery-order/baru?contractId=${contract.id}`}>
                        <Plus />
                        Delivery Order Baru
                      </Link>
                    </Button>
                  ) : null
                }
              />
            ) : (
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <Th>Nomor DO</Th>
                      <Th>Tahap</Th>
                      <Th numeric>Rencana</Th>
                      <Th numeric>Aktual</Th>
                      <Th>Laycan</Th>
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
                          {order.vesselName ? (
                            <span className="block text-xs text-ink-500">{order.vesselName}</span>
                          ) : null}
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
                            {formatDateShort(order.laycanStart)} —{" "}
                            {formatDateShort(order.laycanEnd)}
                          </span>
                        </Td>
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
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Status Kontrak" />
            <CardBody className="space-y-4">
              <StatusBadge meta={CONTRACT_STATUS[contract.status]} />

              <dl className="space-y-3.5">
                <DataItem label="Ditandatangani penjual">
                  {formatDate(contract.signedBySellerAt)}
                </DataItem>
                <DataItem label="Ditandatangani pembeli">
                  {formatDate(contract.signedByBuyerAt)}
                </DataItem>
              </dl>

              <ContractStatusForm
                contractId={contract.id}
                currentStatus={contract.status}
                canManage={canManage}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Ketentuan Kontrak" />
            <CardBody>
              <dl className="space-y-3.5">
                <DataItem label="Total volume">
                  <span className="tnum font-semibold">
                    {formatTonnes(contract.totalVolumeTonnes)}
                  </span>
                </DataItem>
                <DataItem label="Harga">
                  <span className="tnum font-semibold">
                    {formatPrice(contract.priceUsdPerTonne)}
                  </span>
                  <span className="text-xs text-ink-500"> USD/MT</span>
                </DataItem>
                <DataItem label="Nilai kontrak">
                  <span className="tnum font-semibold">{formatUsd(contractValue, 0)}</span>
                  <span className="block text-xs text-ink-500">
                    {formatIdrEquivalent(contractValue)}
                  </span>
                </DataItem>
                <DataItem label="Dasar harga">{contract.priceBasis}</DataItem>
                <DataItem label="Periode">
                  {formatDate(contract.periodStart)} — {formatDate(contract.periodEnd)}
                </DataItem>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tautan" />
            <CardBody>
              <dl className="space-y-3.5">
                <DataItem label="Buyer">
                  <Link
                    href={`/prospek/${contract.prospectId}`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {contract.prospectName}
                  </Link>
                </DataItem>
                <DataItem label="Opportunity">
                  <Link
                    href={`/opportunity/${contract.opportunityId}`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {contract.opportunityCode}
                  </Link>
                </DataItem>
                <DataItem label="Sales Approval Form">
                  <Link
                    href={`/persetujuan/${contract.salesApprovalFormId}`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {contract.salesApprovalFormCode}
                  </Link>
                </DataItem>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
