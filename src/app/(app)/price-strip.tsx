import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/charts/price-chart";
import { SERIES_COLORS } from "@/components/charts/chart-data";
import { listPriceSources, seriesBySource } from "@/server/repos/prices";
import { trailingChange } from "@/domain/price";
import { formatDate, formatPrice, formatSignedPercent, isoDaysAgo, todayIso } from "@/lib/format";

/**
 * Coal price strip on the dashboard: latest value, 7-day change and a sparkline
 * per source. The MoM's primary view requirement, surfaced where management
 * already looks (specification §9.1).
 */
export async function PriceStrip() {
  const [sources, series] = await Promise.all([
    listPriceSources(),
    seriesBySource({ from: isoDaysAgo(45), to: todayIso() }),
  ]);

  return (
    <Card>
      <CardHeader
        title="Indeks Harga Batubara"
        description="Harga terkini dan perubahan 7 hari. Seluruh nilai adalah data sintetis."
        action={
          <Link
            href="/harga-batubara"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
          >
            Analisa lengkap <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {sources.map((source, index) => {
            const points = series.get(source.code) ?? [];
            const change = trailingChange(points, 7);
            const color = SERIES_COLORS[index % SERIES_COLORS.length];

            return (
              <div key={source.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-semibold text-ink-900">{source.code}</p>
                  <Badge tone="neutral" className="text-[10px]">
                    {source.region}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-ink-400">{source.specLabel}</p>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="tnum text-xl font-semibold text-ink-900">
                    {formatPrice(change.latest?.price)}
                  </span>
                  <span className="text-[11px] text-ink-400">USD/MT</span>
                </div>

                <div className="mt-1 flex items-center gap-1.5">
                  <ChangeIndicator percent={change.percent} />
                  <span className="text-[11px] text-ink-400">7 hari</span>
                </div>

                <div className="mt-2">
                  <Sparkline data={points.slice(-30)} color={color} />
                </div>

                <p className="mt-1 text-[10px] text-ink-400">
                  Per {formatDate(change.latest?.date)}
                </p>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function ChangeIndicator({ percent }: { percent: number | null }) {
  if (percent === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-400">
        <Minus className="size-3.5" />—
      </span>
    );
  }

  const rising = percent > 0;
  const flat = percent === 0;
  const Icon = flat ? Minus : rising ? TrendingUp : TrendingDown;

  return (
    <span
      className={
        flat
          ? "inline-flex items-center gap-1 text-[13px] font-medium text-ink-500"
          : rising
            ? "inline-flex items-center gap-1 text-[13px] font-medium text-success-ink"
            : "inline-flex items-center gap-1 text-[13px] font-medium text-danger-ink"
      }
    >
      <Icon className="size-3.5" />
      <span className="tnum">{formatSignedPercent(percent)}</span>
    </span>
  );
}
