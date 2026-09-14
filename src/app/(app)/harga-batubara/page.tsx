import Link from "next/link";
import { Database } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Table, TableWrapper, Td, Th, Tr } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  earliestObservationDate,
  listIngestionRuns,
  listObservations,
  listPriceSources,
  seriesBySource,
} from "@/server/repos/prices";
import { compareYears, type PricePoint } from "@/domain/price";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  isoDaysAgo,
  todayIso,
} from "@/lib/format";
import { IngestButton } from "./ingest-button";
import {
  ChangeText,
  PeriodComparisonCard,
  RangeSummaryTable,
  SevenDayMatrix,
  TrendCard,
} from "./views";

export const metadata = { title: "Intelijen Harga Batubara" };

const TABS = [
  { key: "ringkasan", label: "Ringkasan & Tren" },
  { key: "periode", label: "Perbandingan Periode" },
  { key: "tahun", label: "Perbandingan Tahun" },
  { key: "sumber", label: "Sumber & Ingestion" },
] as const;

const RANGE_PRESETS = [
  { key: "7", label: "7 hari", days: 7 },
  { key: "30", label: "30 hari", days: 30 },
  { key: "90", label: "90 hari", days: 90 },
  { key: "365", label: "1 tahun", days: 365 },
  { key: "1095", label: "3 tahun", days: 1095 },
  { key: "1825", label: "5 tahun", days: 1825 },
] as const;

interface SearchParams {
  view?: string;
  range?: string;
  from?: string;
  to?: string;
  source?: string;
  aFrom?: string;
  aTo?: string;
  bFrom?: string;
  bTo?: string;
  years?: string;
  yFrom?: string;
  yTo?: string;
}

export default async function CoalPricePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view = TABS.some((t) => t.key === params.view) ? params.view! : "ringkasan";

  const [sources, earliest] = await Promise.all([listPriceSources(), earliestObservationDate()]);
  const sourceCodes = sources.map((s) => s.code);
  const minDate = earliest ?? isoDaysAgo(1825);

  return (
    <>
      <PageHeader
        title="Intelijen Harga Batubara"
        description="Riwayat indeks harga terpusat — menggantikan pencarian manual melalui email harian."
        action={
          <Badge tone="warning">
            <Database className="size-3" />
            Adapter mock · data sintetis
          </Badge>
        }
      />

      <Alert variant="warning" className="mb-4" title="Data sintetis, bukan harga pasar">
        Seluruh angka pada halaman ini dihasilkan oleh penyedia mock untuk keperluan
        demonstrasi. Koneksi ke penyedia indeks sebenarnya belum dibuat dan memerlukan
        dokumentasi serta kredensial dari keempat server (2 Singapura, 2 Tiongkok).
      </Alert>

      <nav className="mb-4 flex flex-wrap gap-1 border-b border-ink-200/70">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={{ pathname: "/harga-batubara", query: { ...params, view: tab.key } }}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
              view === tab.key
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {view === "ringkasan" ? (
        <SummaryView params={params} sources={sources} sourceCodes={sourceCodes} minDate={minDate} />
      ) : null}
      {view === "periode" ? (
        <PeriodView params={params} sourceCodes={sourceCodes} minDate={minDate} />
      ) : null}
      {view === "tahun" ? (
        <YearView params={params} sourceCodes={sourceCodes} minDate={minDate} />
      ) : null}
      {view === "sumber" ? <SourcesView /> : null}
    </>
  );
}

// --- Ringkasan & tren -------------------------------------------------------

async function SummaryView({
  params,
  sources,
  sourceCodes,
  minDate,
}: {
  params: SearchParams;
  sources: Awaited<ReturnType<typeof listPriceSources>>;
  sourceCodes: string[];
  minDate: string;
}) {
  const preset = RANGE_PRESETS.find((p) => p.key === params.range) ?? RANGE_PRESETS[1];
  const from = params.from || isoDaysAgo(preset.days);
  const to = params.to || todayIso();

  const [weekObservations, rangeSeries] = await Promise.all([
    // Today plus the previous seven days — the MoM's primary view.
    listObservations({ from: isoDaysAgo(7), to: todayIso() }),
    seriesBySource({ from, to }),
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Hari Ini dan 7 Hari Sebelumnya"
          description="Tampilan utama harian. Klik angka untuk melihat sumber dan waktu pengambilan."
        />
        <SevenDayMatrix sources={sources} observations={weekObservations} />
      </Card>

      <Card>
        <CardHeader title="Filter Rentang" description="Gunakan preset atau tentukan tanggal sendiri." />
        <CardBody>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {RANGE_PRESETS.map((option) => (
              <Link
                key={option.key}
                href={{
                  pathname: "/harga-batubara",
                  query: { view: "ringkasan", range: option.key },
                }}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
                  params.range === option.key || (!params.range && option.key === "30")
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100"
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>

          <form className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="view" value="ringkasan" />
            <div>
              <label htmlFor="from" className="label-caps mb-1 block">
                Dari
              </label>
              <Input id="from" name="from" type="date" defaultValue={from} min={minDate} max={to} />
            </div>
            <div>
              <label htmlFor="to" className="label-caps mb-1 block">
                Sampai
              </label>
              <Input id="to" name="to" type="date" defaultValue={to} min={from} max={todayIso()} />
            </div>
            <Button type="submit" variant="secondary">
              Terapkan
            </Button>
          </form>
        </CardBody>
      </Card>

      <TrendCard
        series={rangeSeries}
        sourceCodes={sourceCodes}
        title="Tren Harga"
        description={`${formatDate(from)} — ${formatDate(to)}`}
      />

      <Card>
        <CardHeader title="Statistik Rentang" description="Ringkasan per sumber pada rentang terpilih." />
        <RangeSummaryTable series={rangeSeries} sources={sources} />
      </Card>
    </div>
  );
}

// --- Perbandingan periode ---------------------------------------------------

async function PeriodView({
  params,
  sourceCodes,
  minDate,
}: {
  params: SearchParams;
  sourceCodes: string[];
  minDate: string;
}) {
  const source = sourceCodes.includes(params.source ?? "") ? params.source! : sourceCodes[0];

  // Defaults chosen to answer the MoM's question directly: the last 90 days
  // against the same 90 days three years earlier.
  const aFrom = params.aFrom || isoDaysAgo(90);
  const aTo = params.aTo || todayIso();
  const bFrom = params.bFrom || shiftYears(aFrom, -3);
  const bTo = params.bTo || shiftYears(aTo, -3);

  const [seriesA, seriesB] = await Promise.all([
    seriesBySource({ from: aFrom, to: aTo, sourceCodes: [source] }),
    seriesBySource({ from: bFrom, to: bTo, sourceCodes: [source] }),
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Pilih Dua Periode"
          description="Bandingkan periode berjalan dengan periode mana pun, termasuk beberapa tahun sebelumnya."
        />
        <CardBody>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <input type="hidden" name="view" value="periode" />

            <div className="sm:col-span-5">
              <label htmlFor="source" className="label-caps mb-1 block">
                Sumber indeks
              </label>
              <Select id="source" name="source" defaultValue={source} className="max-w-xs">
                {sourceCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-2">
              <p className="label-caps mb-1">Periode A</p>
              <div className="flex gap-2">
                <Input name="aFrom" type="date" defaultValue={aFrom} min={minDate} />
                <Input name="aTo" type="date" defaultValue={aTo} min={minDate} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <p className="label-caps mb-1">Periode B</p>
              <div className="flex gap-2">
                <Input name="bFrom" type="date" defaultValue={bFrom} min={minDate} />
                <Input name="bTo" type="date" defaultValue={bTo} min={minDate} />
              </div>
            </div>

            <div className="flex items-end">
              <Button type="submit" variant="secondary">
                Bandingkan
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <PeriodComparisonCard
        sourceCode={source}
        labelA={`${formatDate(aFrom)} — ${formatDate(aTo)}`}
        labelB={`${formatDate(bFrom)} — ${formatDate(bTo)}`}
        pointsA={seriesA.get(source) ?? []}
        pointsB={seriesB.get(source) ?? []}
      />
    </div>
  );
}

// --- Perbandingan tahun -----------------------------------------------------

async function YearView({
  params,
  sourceCodes,
  minDate,
}: {
  params: SearchParams;
  sourceCodes: string[];
  minDate: string;
}) {
  const source = sourceCodes.includes(params.source ?? "") ? params.source! : sourceCodes[0];
  const currentYear = new Date().getUTCFullYear();
  const earliestYear = Number(minDate.slice(0, 4));

  // Same calendar window across years: the MoM's "harga saat ini dibanding
  // tiga tahun lalu", generalised.
  const yFrom = params.yFrom || `${isoDaysAgo(30).slice(5)}`;
  const yTo = params.yTo || `${todayIso().slice(5)}`;

  const years: number[] = [];
  for (let year = currentYear; year >= earliestYear; year -= 1) years.push(year);

  const pointsByYear = new Map<number, PricePoint[]>();
  await Promise.all(
    years.map(async (year) => {
      const series = await seriesBySource({
        from: `${year}-${yFrom}`,
        to: `${year}-${yTo}`,
        sourceCodes: [source],
      });
      pointsByYear.set(year, series.get(source) ?? []);
    })
  );

  const rows = compareYears(pointsByYear, { fromMonthDay: yFrom, toMonthDay: yTo });
  const withData = rows.filter((row) => row.summary.count > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Jendela Kalender yang Sama Antar Tahun"
          description="Menjawab pertanyaan: bagaimana harga saat ini dibandingkan periode yang sama beberapa tahun lalu."
        />
        <CardBody>
          <form className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="view" value="tahun" />
            <div>
              <label htmlFor="source" className="label-caps mb-1 block">
                Sumber indeks
              </label>
              <Select id="source" name="source" defaultValue={source}>
                {sourceCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="yFrom" className="label-caps mb-1 block">
                Dari (bulan-tanggal)
              </label>
              <Input id="yFrom" name="yFrom" defaultValue={yFrom} placeholder="MM-DD" pattern="\d{2}-\d{2}" />
            </div>
            <div>
              <label htmlFor="yTo" className="label-caps mb-1 block">
                Sampai (bulan-tanggal)
              </label>
              <Input id="yTo" name="yTo" defaultValue={yTo} placeholder="MM-DD" pattern="\d{2}-\d{2}" />
            </div>
            <Button type="submit" variant="secondary">
              Bandingkan
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Perbandingan Antar Tahun — ${source}`}
          description={`Jendela ${yFrom} sampai ${yTo}, dibandingkan terhadap tahun ${currentYear}.`}
        />
        {withData.length === 0 ? (
          <EmptyState
            title="Tidak ada data pada jendela ini"
            description="Periksa format bulan-tanggal (MM-DD) atau pilih jendela lain."
          />
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Tahun</Th>
                  <Th numeric>Observasi</Th>
                  <Th numeric>Rata-rata</Th>
                  <Th numeric>Terendah</Th>
                  <Th numeric>Tertinggi</Th>
                  <Th numeric>Selisih vs {currentYear}</Th>
                </tr>
              </thead>
              <tbody>
                {withData.map((row) => (
                  <Tr key={row.year}>
                    <Td>
                      <span className="font-medium text-ink-900">{row.year}</span>
                      {row.year === currentYear ? (
                        <Badge tone="info" className="ml-2">
                          Tahun berjalan
                        </Badge>
                      ) : null}
                    </Td>
                    <Td numeric>{row.summary.count}</Td>
                    <Td numeric className="font-medium text-ink-900">
                      {formatPrice(row.summary.average)}
                    </Td>
                    <Td numeric>{formatPrice(row.summary.min)}</Td>
                    <Td numeric>{formatPrice(row.summary.max)}</Td>
                    <Td numeric>
                      {row.year === currentYear ? (
                        <span className="text-ink-400">—</span>
                      ) : (
                        <ChangeText
                          absolute={row.averageDeltaVsLatest}
                          percent={row.averagePercentVsLatest}
                        />
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
        <CardBody className="border-t border-ink-200/70">
          <p className="text-xs text-ink-400">
            Selisih dihitung sebagai rata-rata tahun {currentYear} dikurangi rata-rata tahun
            terkait. Nilai positif berarti harga tahun berjalan lebih tinggi.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

// --- Sumber & ingestion -----------------------------------------------------

async function SourcesView() {
  const [sources, runs] = await Promise.all([listPriceSources(), listIngestionRuns(12)]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Sumber Data"
          description="Empat server indeks sesuai kondisi existing: dua di Singapura, dua di Tiongkok."
        />
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Kode</Th>
                <Th>Nama</Th>
                <Th>Penyedia</Th>
                <Th>Wilayah</Th>
                <Th>Spesifikasi</Th>
                <Th>Satuan</Th>
                <Th>Jenis Koneksi</Th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <Tr key={source.id}>
                  <Td className="font-medium text-ink-900">{source.code}</Td>
                  <Td>{source.name}</Td>
                  <Td>{source.provider}</Td>
                  <Td>{source.region}</Td>
                  <Td>{source.specLabel}</Td>
                  <Td>{source.unit}</Td>
                  <Td>
                    {source.isMock ? (
                      <Badge tone="warning">Mock adapter</Badge>
                    ) : (
                      <Badge tone="success">Live</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
        <CardBody className="border-t border-ink-200/70">
          <Alert variant="info" title="Batas integrasi">
            Penambahan penyedia sebenarnya dilakukan dengan menulis satu kelas yang
            mengimplementasikan antarmuka <code>CoalPriceProvider</code> dan mendaftarkannya.
            Tidak ada bagian lain dari aplikasi yang perlu diubah. Indeks domestik Tiongkok pada
            praktiknya dikutip dalam CNY/tonne sehingga memerlukan normalisasi kurs — kolom
            satuan dan mata uang sudah disiapkan untuk itu.
          </Alert>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Riwayat Pengambilan Data"
          description="Setiap pengambilan tercatat beserta jumlah baris dan hasilnya."
          action={<IngestButton />}
        />
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Sumber</Th>
                <Th>Adapter</Th>
                <Th>Mulai</Th>
                <Th>Selesai</Th>
                <Th numeric>Baris</Th>
                <Th>Status</Th>
                <Th>Keterangan</Th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <Tr key={run.id}>
                  <Td className="font-medium text-ink-900">{run.sourceCode}</Td>
                  <Td>
                    <code className="text-xs">{run.adapterName}</code>
                  </Td>
                  <Td>{formatDateTime(run.startedAt)}</Td>
                  <Td>{formatDateTime(run.finishedAt)}</Td>
                  <Td numeric>{run.rowsIngested}</Td>
                  <Td>
                    <Badge
                      tone={
                        run.status === "berhasil"
                          ? "success"
                          : run.status === "gagal"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {run.status}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-500">{run.message}</span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
        <CardBody className="border-t border-ink-200/70">
          <p className="text-xs text-ink-400">
            Pengambilan bersifat idempoten: menjalankannya dua kali tidak menduplikasi data
            karena observasi di-upsert berdasarkan pasangan (sumber, tanggal observasi).
            Penjadwalan otomatis, retry, dan peringatan kegagalan merupakan kebutuhan produksi
            yang belum dibangun.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function shiftYears(isoDate: string, years: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString().slice(0, 10);
}
