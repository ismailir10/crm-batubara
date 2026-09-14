import "server-only";
import { query } from "@/lib/session";
import type { DeliveryOrder, DoStatus } from "@/domain/types";

const SELECT = `
  select d.id, d.do_number, d.contract_id, c.contract_number, p.company_name as prospect_name,
         d.stage_id, st.stage_no, d.planned_volume_tonnes, d.actual_volume_tonnes,
         d.laycan_start, d.laycan_end, d.loading_point, d.destination, d.vessel_name,
         d.status, d.created_at
  from delivery_orders d
  join contracts c on c.id = d.contract_id
  join prospects p on p.id = c.prospect_id
  join contract_delivery_stages st on st.id = d.stage_id
`;

interface Row {
  id: string;
  do_number: string;
  contract_id: string;
  contract_number: string;
  prospect_name: string;
  stage_id: string;
  stage_no: number;
  planned_volume_tonnes: number;
  actual_volume_tonnes: number | null;
  laycan_start: string | null;
  laycan_end: string | null;
  loading_point: string | null;
  destination: string | null;
  vessel_name: string | null;
  status: DoStatus;
  created_at: Date;
}

function map(row: Row): DeliveryOrder {
  return {
    id: row.id,
    doNumber: row.do_number,
    contractId: row.contract_id,
    contractNumber: row.contract_number,
    prospectName: row.prospect_name,
    stageId: row.stage_id,
    stageNo: row.stage_no,
    plannedVolumeTonnes: row.planned_volume_tonnes,
    actualVolumeTonnes: row.actual_volume_tonnes,
    laycanStart: row.laycan_start,
    laycanEnd: row.laycan_end,
    loadingPoint: row.loading_point,
    destination: row.destination,
    vesselName: row.vessel_name,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listDeliveryOrders(filters: {
  status?: DoStatus | "all";
  contractId?: string;
  search?: string;
}): Promise<DeliveryOrder[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    conditions.push(`d.status = $${params.length}`);
  }
  if (filters.contractId) {
    params.push(filters.contractId);
    conditions.push(`d.contract_id = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(d.do_number ilike $${params.length} or c.contract_number ilike $${params.length} or p.company_name ilike $${params.length})`
    );
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT} ${where} order by coalesce(d.laycan_start, d.created_at::date) desc`,
      params
    );
    return result.rows.map(map);
  });
}

export async function getDeliveryOrder(id: string): Promise<DeliveryOrder | null> {
  return query(async (client) => {
    const result = await client.query<Row>(`${SELECT} where d.id = $1`, [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  });
}

export async function listDeliveryOrdersByStage(stageId: string): Promise<DeliveryOrder[]> {
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT} where d.stage_id = $1 order by d.do_number`,
      [stageId]
    );
    return result.rows.map(map);
  });
}
