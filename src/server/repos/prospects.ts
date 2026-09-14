import "server-only";
import { query } from "@/lib/session";
import type { Prospect, ProspectStatus } from "@/domain/types";

const SELECT = `
  select p.id, p.code, p.company_name, p.country, p.city, p.contact_person, p.contact_role,
         p.contact_email, p.contact_phone, p.source, p.status, p.owner_id,
         u.full_name as owner_name, p.notes, p.created_at, p.updated_at
  from prospects p
  join users u on u.id = p.owner_id
`;

interface Row {
  id: string;
  code: string;
  company_name: string;
  country: string;
  city: string | null;
  contact_person: string | null;
  contact_role: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  source: string | null;
  status: ProspectStatus;
  owner_id: string;
  owner_name: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function map(row: Row): Prospect {
  return {
    id: row.id,
    code: row.code,
    companyName: row.company_name,
    country: row.country,
    city: row.city,
    contactPerson: row.contact_person,
    contactRole: row.contact_role,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    source: row.source,
    status: row.status,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listProspects(filters: {
  search?: string;
  status?: ProspectStatus | "all";
}): Promise<Prospect[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(p.company_name ilike $${params.length} or p.code ilike $${params.length} or p.contact_person ilike $${params.length})`
    );
  }
  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    conditions.push(`p.status = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT} ${where} order by p.created_at desc`,
      params
    );
    return result.rows.map(map);
  });
}

export async function getProspect(id: string): Promise<Prospect | null> {
  return query(async (client) => {
    const result = await client.query<Row>(`${SELECT} where p.id = $1`, [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  });
}

/** Minimal list for select inputs. */
export async function listProspectOptions(): Promise<{ id: string; label: string }[]> {
  return query(async (client) => {
    const result = await client.query<{ id: string; code: string; company_name: string }>(
      `select id, code, company_name from prospects
       where status in ('baru','terkualifikasi')
       order by company_name`
    );
    return result.rows.map((row) => ({
      id: row.id,
      label: `${row.company_name} (${row.code})`,
    }));
  });
}
