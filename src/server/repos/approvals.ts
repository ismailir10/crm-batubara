import "server-only";
import { query } from "@/lib/session";
import type { SafStatus, SalesApprovalForm } from "@/domain/types";

const SELECT = `
  select s.id, s.code, s.opportunity_id, o.code as opportunity_code, o.title as opportunity_title,
         p.company_name as prospect_name, s.proposed_volume_tonnes, s.proposed_price_usd_per_tonne,
         s.proposed_value_usd, s.payment_term, s.delivery_term, s.contract_period_start,
         s.contract_period_end, s.justification, s.ref_source_code, s.ref_source_name,
         s.ref_price_usd_per_tonne, s.ref_observation_date, s.status,
         sb.full_name as submitted_by_name, s.submitted_at,
         db.full_name as decided_by_name, s.decided_at, s.decision_note, s.created_at,
         c.id as contract_id
  from sales_approval_forms s
  join opportunities o on o.id = s.opportunity_id
  join prospects p on p.id = o.prospect_id
  left join users sb on sb.id = s.submitted_by
  left join users db on db.id = s.decided_by
  left join contracts c on c.sales_approval_form_id = s.id
`;

interface Row {
  id: string;
  code: string;
  opportunity_id: string;
  opportunity_code: string;
  opportunity_title: string;
  prospect_name: string;
  proposed_volume_tonnes: number;
  proposed_price_usd_per_tonne: number;
  proposed_value_usd: number;
  payment_term: string;
  delivery_term: string;
  contract_period_start: string | null;
  contract_period_end: string | null;
  justification: string;
  ref_source_code: string | null;
  ref_source_name: string | null;
  ref_price_usd_per_tonne: number | null;
  ref_observation_date: string | null;
  status: SafStatus;
  submitted_by_name: string | null;
  submitted_at: Date | null;
  decided_by_name: string | null;
  decided_at: Date | null;
  decision_note: string | null;
  created_at: Date;
  contract_id: string | null;
}

function map(row: Row): SalesApprovalForm {
  return {
    id: row.id,
    code: row.code,
    opportunityId: row.opportunity_id,
    opportunityCode: row.opportunity_code,
    opportunityTitle: row.opportunity_title,
    prospectName: row.prospect_name,
    proposedVolumeTonnes: row.proposed_volume_tonnes,
    proposedPriceUsdPerTonne: row.proposed_price_usd_per_tonne,
    proposedValueUsd: row.proposed_value_usd,
    paymentTerm: row.payment_term,
    deliveryTerm: row.delivery_term,
    contractPeriodStart: row.contract_period_start,
    contractPeriodEnd: row.contract_period_end,
    justification: row.justification,
    refSourceCode: row.ref_source_code,
    refSourceName: row.ref_source_name,
    refPriceUsdPerTonne: row.ref_price_usd_per_tonne,
    refObservationDate: row.ref_observation_date,
    status: row.status,
    submittedByName: row.submitted_by_name,
    submittedAt: row.submitted_at?.toISOString() ?? null,
    decidedByName: row.decided_by_name,
    decidedAt: row.decided_at?.toISOString() ?? null,
    decisionNote: row.decision_note,
    createdAt: row.created_at.toISOString(),
    contractId: row.contract_id,
  };
}

export async function listApprovalForms(filters: {
  status?: SafStatus | "all";
}): Promise<SalesApprovalForm[]> {
  const params: unknown[] = [];
  let where = "";
  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    where = `where s.status = $1`;
  }
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT} ${where}
       order by
         case s.status when 'menunggu_persetujuan' then 0 else 1 end,
         coalesce(s.submitted_at, s.created_at) desc`,
      params
    );
    return result.rows.map(map);
  });
}

export async function getApprovalForm(id: string): Promise<SalesApprovalForm | null> {
  return query(async (client) => {
    const result = await client.query<Row>(`${SELECT} where s.id = $1`, [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  });
}

export async function getApprovalFormByOpportunity(
  opportunityId: string
): Promise<SalesApprovalForm | null> {
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT} where s.opportunity_id = $1 order by s.created_at desc limit 1`,
      [opportunityId]
    );
    return result.rows[0] ? map(result.rows[0]) : null;
  });
}

export async function countPendingApprovals(): Promise<number> {
  return query(async (client) => {
    const result = await client.query<{ count: number }>(
      `select count(*)::int as count from sales_approval_forms where status = 'menunggu_persetujuan'`
    );
    return result.rows[0]?.count ?? 0;
  });
}

/** Approved forms that have not yet been turned into a contract. */
export async function listApprovedFormsWithoutContract(): Promise<SalesApprovalForm[]> {
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT} where s.status = 'disetujui' and c.id is null order by s.decided_at desc`
    );
    return result.rows.map(map);
  });
}
