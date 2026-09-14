import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Database } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataItem } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { getObservation, listIngestionRuns } from "@/server/repos/prices";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";

/**
 * Traceability for a single observation: which source, which provider, which
 * unit, and exactly when it was fetched (specification §9.8, AC-21).
 */
export default async function ObservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const observation = await getObservation(id);
  if (!observation) notFound();

  const runs = await listIngestionRuns(200);
  const run = runs.find((r) => r.id === observation.ingestionRunId) ?? null;

  return (
    <>
      <PageHeader
        title={`${observation.sourceCode} · ${formatDate(observation.observationDate)}`}
        description="Rincian satu observasi harga beserta asal dan waktu pengambilannya."
        breadcrumbs={[
          { label: "Intelijen Harga Batubara", href: "/harga-batubara" },
          { label: "Observasi" },
        ]}
        action={
          <Button asChild variant="secondary">
            <Link href="/harga-batubara">Kembali</Link>
          </Button>
        }
      />

      <div className="grid max-w-4xl grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Nilai Observasi" />
          <CardBody>
            <p className="tnum text-3xl font-semibold text-ink-900">
              {formatPrice(observation.price)}
            </p>
            <p className="mt-1 text-[13px] text-ink-500">
              {observation.unit} · {observation.currency}
            </p>

            <dl className="mt-5 space-y-3.5">
              <DataItem label="Tanggal observasi">
                {formatDate(observation.observationDate)}
              </DataItem>
              <DataItem label="Waktu pengambilan">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5 text-ink-400" />
                  {formatDateTime(observation.fetchedAt)}
                </span>
              </DataItem>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Asal Data" />
          <CardBody>
            <dl className="space-y-3.5">
              <DataItem label="Kode sumber">
                <span className="font-semibold">{observation.sourceCode}</span>
              </DataItem>
              <DataItem label="Nama indeks">{observation.sourceName}</DataItem>
              <DataItem label="Penyedia">{observation.provider}</DataItem>
              <DataItem label="Wilayah server">{observation.region}</DataItem>
              <DataItem label="Adapter">
                {run ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Database className="size-3.5 text-ink-400" />
                    <code className="text-xs">{run.adapterName}</code>
                  </span>
                ) : (
                  "—"
                )}
              </DataItem>
              <DataItem label="Proses pengambilan">
                {run ? (
                  <>
                    <Badge tone={run.status === "berhasil" ? "success" : "danger"}>
                      {run.status}
                    </Badge>
                    <span className="mt-1 block text-xs text-ink-500">{run.message}</span>
                  </>
                ) : (
                  "—"
                )}
              </DataItem>
            </dl>
          </CardBody>
        </Card>

        <Alert variant="warning" className="lg:col-span-2" title="Data sintetis">
          Observasi ini dihasilkan oleh <code>MockCoalPriceProvider</code> dan bukan harga pasar
          sebenarnya. Pada implementasi produksi, kolom yang sama akan diisi oleh adapter
          penyedia indeks resmi, dengan jejak sumber dan waktu pengambilan yang identik.
        </Alert>
      </div>
    </>
  );
}
