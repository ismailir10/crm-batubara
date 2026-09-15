/**
 * Creates the application database and the non-superuser application role.
 *
 * Idempotent: safe to run repeatedly. Creates nothing that already exists and
 * never drops anything.
 *
 *   npm run db:bootstrap
 */
import { Client } from "pg";
import { loadEnv } from "./load-env";

loadEnv();

const ADMIN_URL = process.env.ADMIN_DATABASE_URL;
const APP_URL = process.env.DATABASE_URL;

if (!ADMIN_URL || !APP_URL) {
  console.error("ADMIN_DATABASE_URL and DATABASE_URL must be set. Copy .env.example to .env.local.");
  process.exit(1);
}

const appUrl = new URL(APP_URL);
const dbName = appUrl.pathname.replace(/^\//, "");
const appRole = decodeURIComponent(appUrl.username);
const appPassword = decodeURIComponent(appUrl.password);

const maintenanceUrl = new URL(ADMIN_URL);
maintenanceUrl.pathname = "/postgres";

/**
 * Hosted providers (Neon, Supabase, RDS) give you a database that already
 * exists, often with no `postgres` maintenance database to connect to, and no
 * permission to CREATE DATABASE. In that case connect straight to the target
 * database and only ensure the application role.
 */
const REMOTE = process.env.REMOTE_DB === "yes" || !isLocalHost(ADMIN_URL);

function isLocalHost(url: string) {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

async function main() {
  const client = new Client({
    connectionString: REMOTE ? ADMIN_URL : maintenanceUrl.toString(),
    ssl: REMOTE ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  if (REMOTE) {
    console.log(`remote database detected (${new URL(ADMIN_URL!).hostname})`);
    console.log("skipping CREATE DATABASE — the provider already made it");
  }

  const role = await client.query("select 1 from pg_roles where rolname = $1", [appRole]);
  if (role.rowCount === 0) {
    // Identifiers cannot be parameterised; appRole comes from our own DATABASE_URL.
    await client.query(
      `create role ${quoteIdent(appRole)} with login password ${quoteLiteral(appPassword)}
       nosuperuser nocreatedb nocreaterole`
    );
    console.log(`role ${appRole}: created`);
  } else {
    await client.query(
      `alter role ${quoteIdent(appRole)} with login password ${quoteLiteral(appPassword)}`
    );
    console.log(`role ${appRole}: already exists, password synchronised`);
  }

  if (!REMOTE) {
    const db = await client.query("select 1 from pg_database where datname = $1", [dbName]);
    if (db.rowCount === 0) {
      await client.query(`create database ${quoteIdent(dbName)}`);
      console.log(`database ${dbName}: created`);
    } else {
      console.log(`database ${dbName}: already exists, left untouched`);
    }
    await client.end();
  }

  const dbClient = REMOTE
    ? client
    : new Client({ connectionString: ADMIN_URL });
  if (!REMOTE) await dbClient.connect();

  await dbClient.query(
    `grant connect on database ${quoteIdent(dbName)} to ${quoteIdent(appRole)}`
  );

  // The app role must be able to read the schema it will be granted objects in.
  await dbClient.query(`grant usage on schema public to ${quoteIdent(appRole)}`);

  // Guard the property the whole access-control design rests on: a role that
  // owns the tables, or is a superuser, silently bypasses row level security.
  const check = await dbClient.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
    "select rolsuper, rolbypassrls from pg_roles where rolname = $1",
    [appRole]
  );
  const row = check.rows[0];
  if (row?.rolsuper || row?.rolbypassrls) {
    throw new Error(
      `Role ${appRole} has superuser or BYPASSRLS. RLS would not be enforced — refusing to continue.`
    );
  }
  console.log(`role ${appRole}: verified non-superuser, RLS will apply`);

  await dbClient.end();

  console.log("bootstrap complete");
}

function quoteIdent(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
function quoteLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
