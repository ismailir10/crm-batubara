import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";

/**
 * Database-backed tests.
 *
 * These connect as `crm_app` — the non-superuser application role — so the Row
 * Level Security policies are genuinely in force. Connecting as the owner would
 * bypass RLS and make these tests pass for the wrong reason.
 *
 * Skipped automatically when no database is configured, so a clean checkout can
 * still run the unit suite.
 */
const APP_URL = process.env.DATABASE_URL;
const ADMIN_URL = process.env.ADMIN_DATABASE_URL;
const enabled = Boolean(APP_URL && ADMIN_URL);

const suite = enabled ? describe : describe.skip;

suite("row level security", () => {
  let app: Client;
  let admin: Client;
  let marketingId: string;
  let managementId: string;

  beforeAll(async () => {
    app = new Client({ connectionString: APP_URL });
    admin = new Client({ connectionString: ADMIN_URL });
    await app.connect();
    await admin.connect();

    marketingId = (
      await admin.query<{ id: string }>(
        "select id from users where role = 'marketing' limit 1"
      )
    ).rows[0].id;
    managementId = (
      await admin.query<{ id: string }>(
        "select id from users where role = 'management' limit 1"
      )
    ).rows[0].id;
  });

  afterAll(async () => {
    await app?.end();
    await admin?.end();
  });

  async function asUser<T>(userId: string | null, fn: () => Promise<T>): Promise<T> {
    await app.query("begin");
    await app.query("select set_config('app.user_id', $1, true)", [userId ?? ""]);
    try {
      return await fn();
    } finally {
      // Always roll back: these tests must not mutate the demo data.
      await app.query("rollback");
    }
  }

  async function pendingFormId(): Promise<string> {
    const result = await admin.query<{ id: string }>(
      "select id from sales_approval_forms where status = 'menunggu_persetujuan' limit 1"
    );
    return result.rows[0].id;
  }

  it("refuses to read anything without an established session", async () => {
    await asUser(null, async () => {
      const result = await app.query("select count(*)::int as count from prospects");
      expect(result.rows[0].count).toBe(0);
    });
  });

  it("lets an authenticated user read the shared pipeline", async () => {
    await asUser(marketingId, async () => {
      const result = await app.query("select count(*)::int as count from prospects");
      expect(result.rows[0].count).toBeGreaterThan(0);
    });
  });

  it("blocks marketing from approving a sales approval form", async () => {
    // The core access-control claim: hiding the button is not the mechanism.
    const formId = await pendingFormId();

    await expect(
      asUser(marketingId, async () => {
        await app.query(
          `update sales_approval_forms
             set status = 'disetujui', decided_by = $2, decided_at = now(), decision_note = 'x'
           where id = $1`,
          [formId, marketingId]
        );
      })
    ).rejects.toThrow(/row-level security/i);
  });

  it("blocks marketing from rejecting a sales approval form", async () => {
    const formId = await pendingFormId();

    await expect(
      asUser(marketingId, async () => {
        await app.query(
          `update sales_approval_forms
             set status = 'ditolak', decided_by = $2, decided_at = now(), decision_note = 'x'
           where id = $1`,
          [formId, marketingId]
        );
      })
    ).rejects.toThrow(/row-level security/i);
  });

  it("allows management to approve", async () => {
    const formId = await pendingFormId();

    await asUser(managementId, async () => {
      const result = await app.query(
        `update sales_approval_forms
           set status = 'disetujui', decided_by = $2, decided_at = now(), decision_note = 'ok'
         where id = $1`,
        [formId, managementId]
      );
      expect(result.rowCount).toBe(1);
    });
  });

  it("blocks marketing from writing contracts", async () => {
    await expect(
      asUser(marketingId, async () => {
        await app.query(
          `update contracts set status = 'dibatalkan'
           where id = (select id from contracts limit 1)`
        );
      })
    ).rejects.toThrow(/row-level security/i);
  });

  it("allows marketing to write its own pipeline records", async () => {
    await asUser(marketingId, async () => {
      const result = await app.query(
        `update prospects set notes = 'diubah dalam pengujian'
         where id = (select id from prospects limit 1)`
      );
      expect(result.rowCount).toBe(1);
    });
  });
});

suite("price ingestion idempotency", () => {
  let admin: Client;

  beforeAll(async () => {
    admin = new Client({ connectionString: ADMIN_URL });
    await admin.connect();
  });

  afterAll(async () => {
    await admin?.end();
  });

  it("upserts on (source, observation_date) instead of duplicating", async () => {
    await admin.query("begin");
    try {
      const before = await admin.query<{ count: number }>(
        "select count(*)::int as count from coal_price_observations"
      );

      const target = await admin.query<{
        source_id: string;
        observation_date: string;
        price: number;
      }>(
        `select source_id, observation_date, price
         from coal_price_observations order by observation_date desc limit 1`
      );
      const row = target.rows[0];

      // Re-ingesting the same day, exactly as the adapter does.
      await admin.query(
        `insert into coal_price_observations
           (source_id, observation_date, price, unit, currency, fetched_at)
         values ($1,$2,$3,'USD/tonne','USD', now())
         on conflict (source_id, observation_date) do update
           set price = excluded.price, fetched_at = excluded.fetched_at`,
        [row.source_id, row.observation_date, row.price]
      );

      const after = await admin.query<{ count: number }>(
        "select count(*)::int as count from coal_price_observations"
      );
      expect(after.rows[0].count).toBe(before.rows[0].count);
    } finally {
      await admin.query("rollback");
    }
  });

  it("rejects a duplicate observation inserted without the upsert clause", async () => {
    await admin.query("begin");
    try {
      const row = (
        await admin.query<{ source_id: string; observation_date: string }>(
          `select source_id, observation_date from coal_price_observations limit 1`
        )
      ).rows[0];

      await expect(
        admin.query(
          `insert into coal_price_observations
             (source_id, observation_date, price, unit, currency, fetched_at)
           values ($1,$2,99,'USD/tonne','USD', now())`,
          [row.source_id, row.observation_date]
        )
      ).rejects.toThrow(/duplicate key/i);
    } finally {
      await admin.query("rollback");
    }
  });
});

suite("seeded data invariants", () => {
  let admin: Client;

  beforeAll(async () => {
    admin = new Client({ connectionString: ADMIN_URL });
    await admin.connect();
  });

  afterAll(async () => {
    await admin?.end();
  });

  it("has stage volumes that sum to the contract total", async () => {
    const result = await admin.query<{ contract_number: string; diff: number }>(
      `select c.contract_number,
              c.total_volume_tonnes - coalesce(sum(st.planned_volume_tonnes), 0) as diff
       from contracts c
       left join contract_delivery_stages st on st.contract_id = c.id
       group by c.id, c.contract_number, c.total_volume_tonnes
       having abs(c.total_volume_tonnes - coalesce(sum(st.planned_volume_tonnes), 0)) > 0.01`
    );
    expect(result.rows).toEqual([]);
  });

  it("has no stage allocated beyond its planned volume", async () => {
    const result = await admin.query<{ stage_no: number }>(
      `select st.stage_no
       from contract_delivery_stages st
       where coalesce((select sum(d.planned_volume_tonnes) from delivery_orders d
                       where d.stage_id = st.id and d.status <> 'dibatalkan'), 0)
             > st.planned_volume_tonnes + 0.01`
    );
    expect(result.rows).toEqual([]);
  });

  it("records an actual volume on every completed delivery order", async () => {
    const result = await admin.query<{ do_number: string }>(
      `select do_number from delivery_orders
       where status = 'selesai' and actual_volume_tonnes is null`
    );
    expect(result.rows).toEqual([]);
  });

  it("only has contracts built on approved sales approval forms", async () => {
    const result = await admin.query<{ contract_number: string }>(
      `select c.contract_number
       from contracts c
       join sales_approval_forms s on s.id = c.sales_approval_form_id
       where s.status <> 'disetujui'`
    );
    expect(result.rows).toEqual([]);
  });

  it("has more than three years of price history for every source", async () => {
    const result = await admin.query<{ code: string; years: number }>(
      `select s.code, count(distinct extract(year from o.observation_date))::int as years
       from coal_price_sources s
       join coal_price_observations o on o.source_id = s.id
       group by s.code`
    );
    expect(result.rows.length).toBe(4);
    for (const row of result.rows) {
      expect(row.years).toBeGreaterThanOrEqual(5);
    }
  });

  it("stores a fetch timestamp on every observation, for traceability", async () => {
    const result = await admin.query<{ count: number }>(
      `select count(*)::int as count from coal_price_observations where fetched_at is null`
    );
    expect(result.rows[0].count).toBe(0);
  });

  it("freezes a market reference onto every submitted approval form", async () => {
    const result = await admin.query<{ code: string }>(
      `select code from sales_approval_forms
       where submitted_at is not null
         and (ref_source_code is null or ref_price_usd_per_tonne is null
              or ref_observation_date is null)`
    );
    expect(result.rows).toEqual([]);
  });
});
