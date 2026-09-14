import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { PeriodOverlayChart, PriceTrendChart } from "@/components/charts/price-chart";
import { SERIES_COLORS, mergeSeries } from "@/components/charts/chart-data";
import { comparePeriods, summarise, type PricePoint } from "@/domain/price";
import type { PriceObservation, PriceSource } from "@/domain/types";
import {
  formatDate,
  formatDateShort,
  formatPercent,
  formatPrice,
  formatSignedUsd,
} from "@/lib/format";

/** Legend shared by every chart on this page. */
export function SeriesLegend({ codes }: { codes: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {codes.map((code, index) => (
        <span key={code} className="flex items-center gap-1.5 text-xs text-ink-600">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
          />
          {code}
        </span>
      ))}
    </div>
  );
}

/**
 * Primary view required by the MoM: today plus the previous seven days,
 * all sources, as a matrix. Missing days simply do not appear as columns.
 */
export function SevenDayMatrix({
  sources,
  observations,
}: {
  sources: PriceSource[];
  observations: PriceObservation[];
}) {
  const dates = [...new Set(observations.map((o) => o.observationDate))].sort().reverse();

  if (dates.length === 0) {
    return (
      <EmptyState
        title="Belum ada data harga pada periode ini"
        description="Jalankan pengambilan data pada tab Sumber & Ingestion untuk mengisi periode terkini."
      />
    );
  }

  const lookup = new Map<string, PriceObservation>();
  for (const observation of observations) {
    lookup.set(`${observation.sourceCode}:${observation.observationDate}`, observation);
  }

  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Sumber</Th>
            {dates.map((date) => (
              <Th key={date} numeric>
                {formatDateShort(date)}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <Tr key={source.id}>
              <Td>
                <p className="font-medium text-ink-900">{source.code}</p>
                <p className="text-xs text-ink-500">{source.specLabel}</p>
              </Td>
              {dates.map((date) => {
                const observation = lookup.get(`${source.code}:${date}`);
                return (
                  <Td key={date} numeric>
                    {observation ? (
                      <Link
                        href={`/harga-batubara/observasi/${observation.id}`}
                        className="text-ink-900 hover:text-brand-600"
                      >
                        {formatPrice(observation.price)}
                      </Link>
                    ) : (
                      <span className="text-ink-300" title="Tidak ada observasi pada tanggal ini">
                        —
                      </span>
                    )}
                  </Td>
                );
              })}
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
}

/** Per-source statistics over the selected range. */
export function RangeSummaryTable({
  series,
  sources,
}: {
  series: Map<string, PricePoint[]>;
  sources: PriceSource[];
}) {
  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Sumber</Th>
            <Th numeric>Observasi</Th>
            <Th numeric>Rata-rata</Th>
            <Th numeric>Terendah</Th>
            <Th numeric>Tertinggi</Th>
            <Th numeric>Awal</Th>
            <Th numeric>Akhir</Th>
            <Th numeric>Perubahan</Th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => {
            const summary = summarise(series.get(source.code) ?? []);
            return (
              <Tr key={source.id}>
                <Td>
                  <p className="font-medium text-ink-900">{source.code}</p>
                  <p className="text-xs text-ink-500">{source.region}</p>
                </Td>
                <Td numeric>{summary.count}</Td>
                <Td numeric className="font-medium text-ink-900">
                  {formatPrice(summary.average)}
                </Td>
                <Td numeric>{formatPrice(summary.min)}</Td>
                <Td numeric>{formatPrice(summary.max)}</Td>
                <Td numeric>{formatPrice(summary.first?.price ?? null)}</Td>
                <Td numeric>{formatPrice(summary.last?.price ?? null)}</Td>
                <Td numeric>
                  <ChangeText absolute={summary.changeAbsolute} percent={summary.changePercent} />
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrapper>
  );
}

export function ChangeText({
  absolute,
  percent,
}: {
  absolute: number | null;
  percent: number | null;
}) {
  if (absolute === null) return <span className="text-ink-400">—</span>;
  const tone =
    absolute > 0 ? "text-success-ink" : absolute < 0 ? "text-danger-ink" : "text-ink-600";
  return (
    <span className={`tnum font-medium ${tone}`}>
      {formatSignedUsd(absolute)}
      {percent !== null ? (
        <span className="block text-xs font-normal">
          {percent > 0 ? "+" : percent < 0 ? "−" : ""}
          {formatPercent(Math.abs(percent))}
        </span>
      ) : null}
    </span>
  );
}

export function TrendCard({
  series,
  sourceCodes,
  title,
  description,
}: {
  series: Map<string, PricePoint[]>;
  sourceCodes: string[];
  title: string;
  description: string;
}) {
  const merged = mergeSeries(Object.fromEntries(series));

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={<SeriesLegend codes={sourceCodes} />}
      />
      <CardBody>
        {merged.length === 0 ? (
          <EmptyState
            title="Tidak ada data pada rentang ini"
            description="Perluas rentang tanggal atau pilih sumber lain."
          />
        ) : (
          <>
            <PriceTrendChart data={merged} sourceCodes={sourceCodes} />
            <p className="mt-2 text-xs text-ink-400">
              Sumbu Y dalam USD/tonne. Hari tanpa observasi ditampilkan sebagai putus —
              tidak diinterpolasi. Seluruh nilai adalah data sintetis.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}

/** Two arbitrary periods, side by side, aligned by day index. */
export function PeriodComparisonCard({
  sourceCode,
  labelA,
  labelB,
  pointsA,
  pointsB,
}: {
  sourceCode: string;
  labelA: string;
  labelB: string;
  pointsA: PricePoint[];
  pointsB: PricePoint[];
}) {
  const comparison = comparePeriods(pointsA, pointsB);

  return (
    <Card>
      <CardHeader
        title={`Perbandingan Periode — ${sourceCode}`}
        description={`${labelA} dibandingkan dengan ${labelB}.`}
      />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ComparisonMetric
            label="Rata-rata"
            valueA={comparison.a.average}
            valueB={comparison.b.average}
            delta={comparison.averageDelta}
            percent={comparison.averagePercent}
            labelA={labelA}
            labelB={labelB}
          />
          <ComparisonMetric
            label="Terendah"
            valueA={comparison.a.min}
            valueB={comparison.b.min}
            delta={comparison.minDelta}
            percent={null}
            labelA={labelA}
            labelB={labelB}
          />
          <ComparisonMetric
            label="Tertinggi"
            valueA={comparison.a.max}
            valueB={comparison.b.max}
            delta={comparison.maxDelta}
            percent={null}
            labelA={labelA}
            labelB={labelB}
          />
        </div>

        {comparison.overlay.length === 0 ? (
          <EmptyState
            title="Tidak ada data pada salah satu periode"
            description="Pilih rentang tanggal yang memiliki observasi pada kedua periode."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-ink-600">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[0] }}
                />
                {labelA}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-ink-600">
                <span
                  className="h-0.5 w-4 rounded"
                  style={{ backgroundColor: SERIES_COLORS[2] }}
                />
                {labelB}
              </span>
            </div>
            <PeriodOverlayChart data={comparison.overlay} labelA={labelA} labelB={labelB} />
            <p className="text-xs text-ink-400">
              Kedua periode disejajarkan berdasarkan urutan hari perdagangan, sehingga rentang
              dengan jumlah hari berbeda tetap dapat dibandingkan.
            </p>
          </>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-ink-200/70 pt-4 text-[13px]">
          <div>
            <p className="label-caps mb-1">{labelA}</p>
            <p className="text-ink-600">
              {comparison.a.count} observasi ·{" "}
              {comparison.a.first ? formatDate(comparison.a.first.date) : "—"} —{" "}
              {comparison.a.last ? formatDate(comparison.a.last.date) : "—"}
            </p>
          </div>
          <div>
            <p className="label-caps mb-1">{labelB}</p>
            <p className="text-ink-600">
              {comparison.b.count} observasi ·{" "}
              {comparison.b.first ? formatDate(comparison.b.first.date) : "—"} —{" "}
              {comparison.b.last ? formatDate(comparison.b.last.date) : "—"}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ComparisonMetric({
  label,
  valueA,
  valueB,
  delta,
  percent,
  labelA,
  labelB,
}: {
  label: string;
  valueA: number | null;
  valueB: number | null;
  delta: number | null;
  percent: number | null;
  labelA: string;
  labelB: string;
}) {
  return (
    <div className="rounded-md bg-ink-25 px-4 py-3">
      <p className="label-caps">{label}</p>
      <div className="mt-2 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs text-ink-500">{labelA}</span>
          <span className="tnum text-[15px] font-semibold text-ink-900">
            {formatPrice(valueA)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs text-ink-500">{labelB}</span>
          <span className="tnum text-[15px] font-semibold text-ink-900">
            {formatPrice(valueB)}
          </span>
        </div>
      </div>
      <div className="mt-2 border-t border-ink-200 pt-2">
        {/* A bare signed number here is ambiguous — say which way it runs. */}
        <p className="mb-0.5 text-[11px] text-ink-500">
          Periode A terhadap Periode B
        </p>
        <ChangeText absolute={delta} percent={percent} />
        {delta !== null && delta !== 0 ? (
          <p className="mt-0.5 text-[11px] text-ink-500">
            Periode A {delta > 0 ? "lebih tinggi" : "lebih rendah"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
