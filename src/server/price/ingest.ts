import "server-only";
import { query } from "@/lib/session";
import { getProviders } from "./mock-provider";

/**
 * Price ingestion (specification §13).
 *
 * Idempotent by construction: observations are upserted on
 * (source_id, observation_date), so running twice never duplicates or corrupts
 * data. This is demonstrable live — run it twice and the row count is unchanged.
 *
 * Production concerns not built here: scheduling, retry with backoff, alerting
 * on a failed fetch, reconciliation against the daily email.
 */

export interface IngestionResult {
  sourceCode: string;
  inserted: number;
  updated: number;
  status: "berhasil" | "gagal";
  message: string;
}

export async function runIngestion(options: { days?: number } = {}): Promise<IngestionResult[]> {
  const days = options.days ?? 14;
  const to = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days);

  const results: IngestionResult[] = [];

  for (const provider of getProviders()) {
    const startedAt = new Date();

    try {
      const observations = await provider.fetchRange(from, to);

      const result = await query(async (client) => {
        const source = await client.query<{ id: string }>(
          `select id from coal_price_sources where code = $1`,
          [provider.code]
        );
        const sourceId = source.rows[0]?.id;
        if (!sourceId) {
          throw new Error(`Sumber harga ${provider.code} tidak ditemukan di basis data.`);
        }

        const run = await client.query<{ id: string }>(
          `insert into price_ingestion_runs
             (source_id, adapter_name, started_at, finished_at, status, rows_ingested, message)
           values ($1,$2,$3,now(),'berhasil',0,$4)
           returning id`,
          [
            sourceId,
            provider.adapterName,
            startedAt.toISOString(),
            "Pengambilan manual dari penyedia mock (data sintetis).",
          ]
        );
        const runId = run.rows[0].id;

        let inserted = 0;
        let updated = 0;
        const fetchedAt = new Date().toISOString();

        for (const observation of observations) {
          const upsert = await client.query<{ is_insert: boolean }>(
            `insert into coal_price_observations
               (source_id, observation_date, price, unit, currency, fetched_at, ingestion_run_id)
             values ($1,$2,$3,$4,$5,$6,$7)
             on conflict (source_id, observation_date) do update
               set price = excluded.price,
                   unit = excluded.unit,
                   currency = excluded.currency,
                   fetched_at = excluded.fetched_at,
                   ingestion_run_id = excluded.ingestion_run_id
             returning (xmax = 0) as is_insert`,
            [
              sourceId,
              observation.observationDate,
              observation.price,
              observation.unit,
              observation.currency,
              fetchedAt,
              runId,
            ]
          );
          if (upsert.rows[0]?.is_insert) inserted += 1;
          else updated += 1;
        }

        await client.query(
          `update price_ingestion_runs
             set rows_ingested = $2, finished_at = now(), message = $3
           where id = $1`,
          [
            runId,
            inserted + updated,
            `Pengambilan manual dari penyedia mock: ${inserted} baris baru, ${updated} diperbarui.`,
          ]
        );

        return { inserted, updated };
      });

      results.push({
        sourceCode: provider.code,
        inserted: result.inserted,
        updated: result.updated,
        status: "berhasil",
        message: `${result.inserted} baris baru, ${result.updated} diperbarui.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kesalahan tidak dikenal.";
      // Record the failure so the run log tells the truth about what happened.
      await query(async (client) => {
        const source = await client.query<{ id: string }>(
          `select id from coal_price_sources where code = $1`,
          [provider.code]
        );
        if (source.rows[0]) {
          await client.query(
            `insert into price_ingestion_runs
               (source_id, adapter_name, started_at, finished_at, status, rows_ingested, message)
             values ($1,$2,$3,now(),'gagal',0,$4)`,
            [source.rows[0].id, provider.adapterName, startedAt.toISOString(), message]
          );
        }
      }).catch(() => undefined);

      results.push({
        sourceCode: provider.code,
        inserted: 0,
        updated: 0,
        status: "gagal",
        message,
      });
    }
  }

  return results;
}
