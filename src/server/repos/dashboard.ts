import "server-only";
import { query } from "@/lib/session";
import type { OpportunityStatus } from "@/domain/types";

export interface DashboardSummary {
  pipelineValueUsd: number;
  pipelineCount: number;
  pendingApprovals: number;
  pendingApprovalValueUsd: number;
  fullySignedContracts: number;
  contractsAwaitingCounterSignature: number;
  contractedVolumeTonnes: number;
  deliveredVolumeTonnes: number;
  activeDeliveryOrders: number;
}

export interface FunnelRow {
  status: OpportunityStatus;
  count: number;
  valueUsd: number;
}

export interface ContractProgressRow {
  id: string;
  contractNumber: string;
  prospectName: string;
  totalVolumeTonnes: number;
  deliveredTonnes: number;
  percent: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return query(async (client) => {
    const result = await client.query<{
      pipeline_value: number;
      pipeline_count: number;
      pending_approvals: number;
      pending_approval_value: number;
      fully_signed: number;
      awaiting_counter: number;
      contracted_volume: number;
      delivered_volume: number;
      active_dos: number;
    }>(`
      select
        coalesce((select sum(estimated_value_usd) from opportunities
                  where status in ('on_progress','pending')), 0) as pipeline_value,
        (select count(*) from opportunities
         where status in ('on_progress','pending')) as pipeline_count,
        (select count(*) from sales_approval_forms
         where status = 'menunggu_persetujuan') as pending_approvals,
        coalesce((select sum(proposed_value_usd) from sales_approval_forms
                  where status = 'menunggu_persetujuan'), 0) as pending_approval_value,
        (select count(*) from contracts
         where status = 'ditandatangani_penuh') as fully_signed,
        (select count(*) from contracts
         where status = 'ditandatangani_satu_pihak') as awaiting_counter,
        coalesce((select sum(total_volume_tonnes) from contracts
                  where status in ('ditandatangani_penuh','selesai')), 0) as contracted_volume,
        coalesce((select sum(d.actual_volume_tonnes) from delivery_orders d
                  join contracts c on c.id = d.contract_id
                  where d.status = 'selesai'
                    and c.status in ('ditandatangani_penuh','selesai')), 0) as delivered_volume,
        (select count(*) from delivery_orders
         where status in ('terjadwal','dalam_pengiriman')) as active_dos
    `);

    const row = result.rows[0];
    return {
      pipelineValueUsd: Number(row.pipeline_value),
      pipelineCount: Number(row.pipeline_count),
      pendingApprovals: Number(row.pending_approvals),
      pendingApprovalValueUsd: Number(row.pending_approval_value),
      fullySignedContracts: Number(row.fully_signed),
      contractsAwaitingCounterSignature: Number(row.awaiting_counter),
      contractedVolumeTonnes: Number(row.contracted_volume),
      deliveredVolumeTonnes: Number(row.delivered_volume),
      activeDeliveryOrders: Number(row.active_dos),
    };
  });
}

export async function getOpportunityFunnel(): Promise<FunnelRow[]> {
  return query(async (client) => {
    const result = await client.query<{
      status: OpportunityStatus;
      count: number;
      value_usd: number;
    }>(
      `select status, count(*)::int as count, coalesce(sum(estimated_value_usd), 0) as value_usd
       from opportunities group by status`
    );

    const order: OpportunityStatus[] = ["on_progress", "pending", "close", "drop"];
    return order.map((status) => {
      const found = result.rows.find((row) => row.status === status);
      return {
        status,
        count: found ? Number(found.count) : 0,
        valueUsd: found ? Number(found.value_usd) : 0,
      };
    });
  });
}

export async function getContractProgress(): Promise<ContractProgressRow[]> {
  return query(async (client) => {
    const result = await client.query<{
      id: string;
      contract_number: string;
      prospect_name: string;
      total_volume_tonnes: number;
      delivered: number;
    }>(
      `select c.id, c.contract_number, p.company_name as prospect_name, c.total_volume_tonnes,
              coalesce((select sum(d.actual_volume_tonnes) from delivery_orders d
                        where d.contract_id = c.id and d.status = 'selesai'), 0) as delivered
       from contracts c
       join prospects p on p.id = c.prospect_id
       where c.status in ('ditandatangani_penuh','ditandatangani_satu_pihak','selesai')
       order by c.created_at desc`
    );

    return result.rows
      .map((row) => {
        const total = Number(row.total_volume_tonnes);
        const delivered = Number(row.delivered);
        return {
          id: row.id,
          contractNumber: row.contract_number,
          prospectName: row.prospect_name,
          totalVolumeTonnes: total,
          deliveredTonnes: delivered,
          percent: total === 0 ? 0 : Math.round((delivered / total) * 1000) / 10,
        };
      })
      .sort((a, b) => a.percent - b.percent);
  });
}
