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

async function main() {
  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();

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

  const db = await client.query("select 1 from pg_database where datname = $1", [dbName]);
  if (db.rowCount === 0) {
    await client.query(`create database ${quoteIdent(dbName)}`);
    console.log(`database ${dbName}: created`);
  } else {
    console.log(`database ${dbName}: already exists, left untouched`);
  }

  await client.end();

  const dbClient = new Client({ connectionString: ADMIN_URL });
  await dbClient.connect();
  await dbClient.query(`grant connect on database ${quoteIdent(dbName)} to ${quoteIdent(appRole)}`);
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
