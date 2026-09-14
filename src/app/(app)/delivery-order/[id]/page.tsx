import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { DataItem } from "@/components/ui/form";
import { ProgressBar } from "@/components/stat-tile";
import { getDeliveryOrder } from "@/server/repos/delivery-orders";
import { getContract, listStages } from "@/server/repos/contracts";
import { getSessionUser } from "@/lib/session";
import { DO_STATUS, canManageContracts } from "@/domain/status";
import { progress } from "@/domain/calc";
import { formatDate, formatPercent, formatTonnes } from "@/lib/format";
import { DeliveryOrderStatusForm } from "./do-status-form";

export default async function DeliveryOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getDeliveryOrder(id);
  if (!order) notFound();

  const [contract, stages, user] = await Promise.all([
    getContract(order.contractId),
    listStages(order.contractId),
    getSessionUser(),
  ]);

  const stage = stages.find((s) => s.id === order.stageId) ?? null;
  const canManage = user ? canManageContracts(user.role) : false;
  const stageProgress = stage
    ? progress(stage.plannedVolumeTonnes, stage.deliveredTonnes)
    : null;

  const variance =
    order.actualVolumeTonnes === null
      ? null
      : Math.round((order.actualVolumeTonnes - order.plannedVolumeTonnes) * 100) / 100;

  return (
    <>
      <PageHeader
        title={order.doNumber}
        description={`${order.contractNumber} · ${order.prospectName} · Tahap ${order.stageNo}`}
        breadcrumbs={[
          { label: "Delivery Order", href: "/delivery-order" },
          { label: order.doNumber },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Rincian Pengiriman" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <DataItem label="Volume rencana">
                  <span className="tnum font-semibold">
                    {formatTonnes(order.plannedVolumeTonnes)}
                  </span>
                </DataItem>
                <DataItem label="Volume aktual">
                  <span className="tnum font-semibold">
                    {order.actualVolumeTonnes === null
                      ? "—"
                      : formatTonnes(order.actualVolumeTonnes)}
                  </span>
                </DataItem>
                <DataItem label="Selisih">
                  {variance === null ? (
                    "—"
                  ) : (
                    <span
                      className={
                        variance >= 0
                          ? "tnum font-semibold text-success-ink"
                          : "tnum font-semibold text-warning-ink"
                      }
                    >
                      {variance >= 0 ? "+" : "−"}
                      {formatTonnes(Math.abs(variance))}
                    </span>
                  )}
                </DataItem>
                <DataItem label="Laycan">
                  {formatDate(order.laycanStart)} — {formatDate(order.laycanEnd)}
                </DataItem>
                <DataItem label="Titik muat">{order.loadingPoint ?? "—"}</DataItem>
                <DataItem label="Tujuan">{order.destination ?? "—"}</DataItem>
                <DataItem label="Kapal / tongkang" className="sm:col-span-3">
                  {order.vesselName ?? "—"}
                </DataItem>
              </dl>
            </CardBody>
          </Card>

          {stage && stageProgress ? (
            <Card>
              <CardHeader
                title={`Tahap ${stage.stageNo}`}
                description={`Periode ${formatDate(stage.periodStart)} — ${formatDate(stage.periodEnd)}`}
              />
              <CardBody>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="tnum text-xl font-semibold text-ink-900">
                    {formatPercent(stageProgress.percent, 1)}
                  </span>
                  <span className="tnum text-[13px] text-ink-600">
                    {formatTonnes(stageProgress.delivered)} dari{" "}
                    {formatTonnes(stageProgress.planned)}
                  </span>
                </div>
                <ProgressBar
                  percent={stageProgress.percent}
                  tone={stageProgress.percent >= 100 ? "success" : "brand"}
                />
                <dl className="mt-4 grid grid-cols-3 gap-4">
                  <DataItem label="Rencana tahap">
                    <span className="tnum">{formatTonnes(stage.plannedVolumeTonnes)}</span>
                  </DataItem>
                  <DataItem label="Dialokasikan ke DO">
                    <span className="tnum">{formatTonnes(stage.allocatedTonnes)}</span>
                  </DataItem>
                  <DataItem label="Sisa kuota">
                    <span className="tnum">
                      {formatTonnes(
                        Math.max(
                          Math.round(
                            (stage.plannedVolumeTonnes - stage.allocatedTonnes) * 100
                          ) / 100,
                          0
                        )
                      )}
                    </span>
                  </DataItem>
                </dl>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Status" />
            <CardBody className="space-y-4">
              <StatusBadge meta={DO_STATUS[order.status]} />
              <DeliveryOrderStatusForm
                deliveryOrderId={order.id}
                currentStatus={order.status}
                plannedVolumeTonnes={order.plannedVolumeTonnes}
                canManage={canManage}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tautan" />
            <CardBody>
              <dl className="space-y-3.5">
                <DataItem label="Kontrak">
                  <Link
                    href={`/kontrak/${order.contractId}`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {order.contractNumber}
                  </Link>
                </DataItem>
                {contract ? (
                  <DataItem label="Buyer">
                    <Link
                      href={`/prospek/${contract.prospectId}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {contract.prospectName}
                    </Link>
                  </DataItem>
                ) : null}
                {contract ? (
                  <DataItem label="Opportunity">
                    <Link
                      href={`/opportunity/${contract.opportunityId}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {contract.opportunityCode}
                    </Link>
                  </DataItem>
                ) : null}
                <DataItem label="Diterbitkan">
                  {formatDate(order.createdAt.slice(0, 10))}
                </DataItem>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
