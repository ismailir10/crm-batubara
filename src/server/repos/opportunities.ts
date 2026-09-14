import "server-only";
import { query } from "@/lib/session";
import type {
  Opportunity,
  OpportunityStatus,
  OpportunityStatusHistoryEntry,
} from "@/domain/types";

const SELECT = `
  select o.id, o.code, o.prospect_id, p.company_name as prospect_name, o.title,
         o.coal_gar_kcal, o.coal_tm_pct, o.coal_ash_pct, o.coal_sulphur_pct,
         o.estimated_volume_tonnes, o.estimated_price_usd_per_tonne, o.estimated_value_usd,
         o.delivery_term, o.expected_close_date, o.status, o.owner_id,
         u.full_name as owner_name, o.created_at, o.updated_at
  from opportunities o
  join prospects p on p.id = o.prospect_id
  join users u on u.id = o.owner_id
`;

interface Row {
  id: string;
  code: string;
  prospect_id: string;
  prospect_name: string;
  title: string;
  coal_gar_kcal: number | null;
  coal_tm_pct: number | null;
  coal_ash_pct: number | null;
  coal_sulphur_pct: number | null;
  estimated_volume_tonnes: number;
  estimated_price_usd_per_tonne: number;
  estimated_value_usd: number;
  delivery_term: string;
  expected_close_date: string | null;
  status: OpportunityStatus;
  owner_id: string;
  owner_name: string;
  created_at: Date;
  updated_at: Date;
}

function map(row: Row): Opportunity {
  return {
    id: row.id,
    code: row.code,
    prospectId: row.prospect_id,
    prospectName: row.prospect_name,
    title: row.title,
    coalGarKcal: row.coal_gar_kcal,
    coalTmPct: row.coal_tm_pct,
    coalAshPct: row.coal_ash_pct,
    coalSulphurPct: row.coal_sulphur_pct,
    estimatedVolumeTonnes: row.estimated_volume_tonnes,
    estimatedPriceUsdPerTonne: row.estimated_price_usd_per_tonne,
    estimatedValueUsd: row.estimated_value_usd,
    deliveryTerm: row.delivery_term,
    expectedCloseDate: row.expected_close_date,
    status: row.status,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listOpportunities(filters: {
  search?: string;
  status?: OpportunityStatus | "all";
  prospectId?: string;
}): Promise<Opportunity[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(o.title ilike $${params.length} or o.code ilike $${params.length} or p.company_name ilike $${params.length})`
    );
  }
  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (filters.prospectId) {
    params.push(filters.prospectId);
    conditions.push(`o.prospect_id = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query(async (client) => {
    const result = await client.query<Row>(`${SELECT} ${where} order by o.created_at desc`, params);
    return result.rows.map(map);
  });
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  return query(async (client) => {
    const result = await client.query<Row>(`${SELECT} where o.id = $1`, [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  });
}

export async function getOpportunityHistory(
  opportunityId: string
): Promise<OpportunityStatusHistoryEntry[]> {
  return query(async (client) => {
    const result = await client.query<{
      id: string;
      from_status: OpportunityStatus | null;
      to_status: OpportunityStatus;
      reason: string;
      changed_by_name: string;
      changed_at: Date;
    }>(
      `select h.id, h.from_status, h.to_status, h.reason, u.full_name as changed_by_name, h.changed_at
       from opportunity_status_history h
       join users u on u.id = h.changed_by
       where h.opportunity_id = $1
       order by h.changed_at desc`,
      [opportunityId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      reason: row.reason,
      changedByName: row.changed_by_name,
      changedAt: row.changed_at.toISOString(),
    }));
  });
}

/** Opportunities that may still have an approval form raised against them. */
export async function listOpportunityOptionsForApproval(): Promise<
  { id: string; label: string }[]
> {
  return query(async (client) => {
    const result = await client.query<{ id: string; code: string; title: string }>(
      `select o.id, o.code, o.title
       from opportunities o
       where o.status in ('on_progress','pending')
         and not exists (
           select 1 from sales_approval_forms s
           where s.opportunity_id = o.id
             and s.status in ('draft','menunggu_persetujuan','disetujui')
         )
       order by o.created_at desc`
    );
    return result.rows.map((row) => ({ id: row.id, label: `${row.code} — ${row.title}` }));
  });
}
