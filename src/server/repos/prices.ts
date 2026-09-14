import "server-only";
import { query } from "@/lib/session";
import type { IngestionRun, IngestionStatus, PriceObservation, PriceSource } from "@/domain/types";
import type { PricePoint } from "@/domain/price";

const OBSERVATION_SELECT = `
  select o.id, o.source_id, s.code as source_code, s.name as source_name, s.provider, s.region,
         o.observation_date, o.price, o.unit, o.currency, o.fetched_at, o.ingestion_run_id
  from coal_price_observations o
  join coal_price_sources s on s.id = o.source_id
`;

interface ObservationRow {
  id: string;
  source_id: string;
  source_code: string;
  source_name: string;
  provider: string;
  region: string;
  observation_date: string;
  price: number;
  unit: string;
  currency: string;
  fetched_at: Date;
  ingestion_run_id: string | null;
}

function mapObservation(row: ObservationRow): PriceObservation {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceCode: row.source_code,
    sourceName: row.source_name,
    provider: row.provider,
    region: row.region,
    observationDate: row.observation_date,
    price: row.price,
    unit: row.unit,
    currency: row.currency,
    fetchedAt: row.fetched_at.toISOString(),
    ingestionRunId: row.ingestion_run_id,
  };
}

export async function listPriceSources(): Promise<PriceSource[]> {
  return query(async (client) => {
    const result = await client.query<{
      id: string;
      code: string;
      name: string;
      provider: string;
      region: string;
      spec_label: string | null;
      unit: string;
      currency: string;
      is_mock: boolean;
      sort_order: number;
    }>(
      `select id, code, name, provider, region, spec_label, unit, currency, is_mock, sort_order
       from coal_price_sources where is_active order by sort_order`
    );
    return result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      provider: row.provider,
      region: row.region,
      specLabel: row.spec_label,
      unit: row.unit,
      currency: row.currency,
      isMock: row.is_mock,
      sortOrder: row.sort_order,
    }));
  });
}

export async function listObservations(params: {
  from: string;
  to: string;
  sourceCodes?: string[];
}): Promise<PriceObservation[]> {
  return query(async (client) => {
    const values: unknown[] = [params.from, params.to];
    let filter = "";
    if (params.sourceCodes && params.sourceCodes.length > 0) {
      values.push(params.sourceCodes);
      filter = `and s.code = any($3::text[])`;
    }
    const result = await client.query<ObservationRow>(
      `${OBSERVATION_SELECT}
       where o.observation_date between $1 and $2 ${filter}
       order by o.observation_date asc, s.sort_order asc`,
      values
    );
    return result.rows.map(mapObservation);
  });
}

export async function getObservation(id: string): Promise<PriceObservation | null> {
  return query(async (client) => {
    const result = await client.query<ObservationRow>(`${OBSERVATION_SELECT} where o.id = $1`, [id]);
    return result.rows[0] ? mapObservation(result.rows[0]) : null;
  });
}

/**
 * Series per source over a range, shaped for the comparison engine.
 * Returns only days that exist — gaps are never filled (specification §13).
 */
export async function seriesBySource(params: {
  from: string;
  to: string;
  sourceCodes?: string[];
}): Promise<Map<string, PricePoint[]>> {
  const observations = await listObservations(params);
  const series = new Map<string, PricePoint[]>();
  for (const observation of observations) {
    const list = series.get(observation.sourceCode) ?? [];
    list.push({ date: observation.observationDate, price: observation.price });
    series.set(observation.sourceCode, list);
  }
  return series;
}

/** Latest observation per source, for dashboard tiles. */
export async function latestPerSource(): Promise<PriceObservation[]> {
  return query(async (client) => {
    const result = await client.query<ObservationRow>(
      `${OBSERVATION_SELECT}
       where o.id in (
         select distinct on (source_id) id
         from coal_price_observations
         order by source_id, observation_date desc
       )
       order by s.sort_order`
    );
    return result.rows.map(mapObservation);
  });
}

export async function listIngestionRuns(limit = 12): Promise<IngestionRun[]> {
  return query(async (client) => {
    const result = await client.query<{
      id: string;
      source_id: string;
      source_code: string;
      source_name: string;
      adapter_name: string;
      started_at: Date;
      finished_at: Date | null;
      status: IngestionStatus;
      rows_ingested: number;
      message: string | null;
    }>(
      `select r.id, r.source_id, s.code as source_code, s.name as source_name, r.adapter_name,
              r.started_at, r.finished_at, r.status, r.rows_ingested, r.message
       from price_ingestion_runs r
       join coal_price_sources s on s.id = r.source_id
       order by r.started_at desc
       limit $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      sourceId: row.source_id,
      sourceCode: row.source_code,
      sourceName: row.source_name,
      adapterName: row.adapter_name,
      startedAt: row.started_at.toISOString(),
      finishedAt: row.finished_at?.toISOString() ?? null,
      status: row.status,
      rowsIngested: row.rows_ingested,
      message: row.message,
    }));
  });
}

/** Earliest observation date on record, used to bound date pickers. */
export async function earliestObservationDate(): Promise<string | null> {
  return query(async (client) => {
    const result = await client.query<{ min: string | null }>(
      `select min(observation_date) as min from coal_price_observations`
    );
    return result.rows[0]?.min ?? null;
  });
}
