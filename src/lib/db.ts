import "server-only";
import { Pool, types, type PoolClient } from "pg";

/**
 * Data access layer.
 *
 * Plain Postgres over the `pg` driver — no vendor client library. Swapping the
 * demo database for an internal on-premise Postgres is a DATABASE_URL change
 * and nothing else (decision D-013).
 *
 * Every request runs inside a transaction that sets `app.user_id`, which is what
 * the RLS policies read. The application connects as a non-superuser role, so
 * those policies are actually enforced rather than decorative.
 */

// numeric/decimal → number. Safe here: tonnage and USD prices are well inside
// float range, and the alternative is string arithmetic bugs throughout the app.
types.setTypeParser(types.builtins.NUMERIC, (value) => (value === null ? null : parseFloat(value)));
types.setTypeParser(types.builtins.INT8, (value) => (value === null ? null : parseInt(value, 10)));
// date → keep as the literal YYYY-MM-DD string, never a timezone-shifted Date.
types.setTypeParser(types.builtins.DATE, (value) => value);

declare global {
  var __crmPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tidak ditemukan. Salin .env.example ke .env.local lalu jalankan npm run db:setup."
    );
  }
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
}

export function getPool(): Pool {
  if (!global.__crmPool) {
    global.__crmPool = createPool();
  }
  return global.__crmPool;
}

/**
 * Runs `fn` inside a transaction with the session user applied, so RLS sees it.
 * Rolls back on any thrown error.
 */
export async function withUser<T>(
  userId: string | null,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.user_id', $1, true)", [userId ?? ""]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/** For queries that must run without a session: login lookup only. */
export async function withoutUser<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
