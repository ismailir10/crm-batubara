import "server-only";
import { query } from "@/lib/session";
import type { Contract, ContractStatus, DeliveryStage } from "@/domain/types";

/**
 * Delivered tonnage counts only delivery orders that reached "selesai".
 * Allocated tonnage counts every order that is not cancelled. Keeping these
 * apart in SQL matters: conflating them makes a contract look shipped when the
 * cargo is still at anchorage.
 */
const SELECT = `
  select c.id, c.contract_number, c.opportunity_id, o.code as opportunity_code,
         c.sales_approval_form_id, s.code as saf_code, c.prospect_id,
         p.company_name as prospect_name, c.title, c.total_volume_tonnes,
         c.price_usd_per_tonne, c.price_basis, c.currency, c.period_start, c.period_end,
         c.status, c.signed_by_seller_at, c.signed_by_buyer_at, c.created_at,
         coalesce((
           select sum(d.actual_volume_tonnes) from delivery_orders d
           where d.contract_id = c.id and d.status = 'selesai'
         ), 0) as delivered_tonnes
  from contracts c
  join opportunities o on o.id = c.opportunity_id
  join sales_approval_forms s on s.id = c.sales_approval_form_id
  join prospects p on p.id = c.prospect_id
`;

interface Row {
  id: string;
  contract_number: string;
  opportunity_id: string;
  opportunity_code: string;
  sales_approval_form_id: string;
  saf_code: string;
  prospect_id: string;
  prospect_name: string;
  title: string;
  total_volume_tonnes: number;
  price_usd_per_tonne: number;
  price_basis: string;
  currency: string;
  period_start: string;
  period_end: string;
  status: ContractStatus;
  signed_by_seller_at: string | null;
  signed_by_buyer_at: string | null;
  created_at: Date;
  delivered_tonnes: number;
}

function map(row: Row): Contract {
  return {
    id: row.id,
    contractNumber: row.contract_number,
    opportunityId: row.opportunity_id,
    opportunityCode: row.opportunity_code,
    salesApprovalFormId: row.sales_approval_form_id,
    salesApprovalFormCode: row.saf_code,
    prospectId: row.prospect_id,
    prospectName: row.prospect_name,
    title: row.title,
    totalVolumeTonnes: row.total_volume_tonnes,
    priceUsdPerTonne: row.price_usd_per_tonne,
    priceBasis: row.price_basis,
    currency: row.currency,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    signedBySellerAt: row.signed_by_seller_at,
    signedByBuyerAt: row.signed_by_buyer_at,
    createdAt: row.created_at.toISOString(),
    deliveredTonnes: Number(row.delivered_tonnes),
  };
}

export async function listContracts(filters: {
  status?: ContractStatus | "all";
  search?: string;
}): Promise<Contract[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    conditions.push(`c.status = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(c.contract_number ilike $${params.length} or c.title ilike $${params.length} or p.company_name ilike $${params.length})`
    );
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query(async (client) => {
    const result = await client.query<Row>(`${SELECT} ${where} order by c.created_at desc`, params);
    return result.rows.map(map);
  });
}

export async function getContract(id: string): Promise<Contract | null> {
  return query(async (client) => {
    const result = await client.query<Row>(`${SELECT} where c.id = $1`, [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  });
}

export async function listStages(contractId: string): Promise<DeliveryStage[]> {
  return query(async (client) => {
    const result = await client.query<{
      id: string;
      contract_id: string;
      stage_no: number;
      planned_volume_tonnes: number;
      period_start: string;
      period_end: string;
      notes: string | null;
      delivered_tonnes: number;
      allocated_tonnes: number;
    }>(
      `select st.id, st.contract_id, st.stage_no, st.planned_volume_tonnes, st.period_start,
              st.period_end, st.notes,
              coalesce((select sum(d.actual_volume_tonnes) from delivery_orders d
                        where d.stage_id = st.id and d.status = 'selesai'), 0) as delivered_tonnes,
              coalesce((select sum(d.planned_volume_tonnes) from delivery_orders d
                        where d.stage_id = st.id and d.status <> 'dibatalkan'), 0) as allocated_tonnes
       from contract_delivery_stages st
       where st.contract_id = $1
       order by st.stage_no`,
      [contractId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      contractId: row.contract_id,
      stageNo: row.stage_no,
      plannedVolumeTonnes: row.planned_volume_tonnes,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      notes: row.notes,
      deliveredTonnes: Number(row.delivered_tonnes),
      allocatedTonnes: Number(row.allocated_tonnes),
    }));
  });
}

/** Contracts that can still receive delivery orders. */
export async function listActiveContractOptions(): Promise<
  { id: string; label: string; stages: DeliveryStage[] }[]
> {
  const contracts = await listContracts({ status: "all" });
  const active = contracts.filter(
    (c) => c.status === "ditandatangani_penuh" || c.status === "ditandatangani_satu_pihak"
  );
  const withStages = await Promise.all(
    active.map(async (contract) => ({
      id: contract.id,
      label: `${contract.contractNumber} — ${contract.prospectName}`,
      stages: await listStages(contract.id),
    }))
  );
  return withStages;
}
