/**
 * Drops and recreates the public schema, so `npm run db:reset` returns the
 * database to a known state before migrations and seed run again.
 *
 * Destructive by design, and only ever points at the database named in
 * ADMIN_DATABASE_URL. Refuses to run against anything that does not look like a
 * local development database unless ALLOW_DESTRUCTIVE_RESET=yes is set.
 */
import { Client } from "pg";
import { loadEnv } from "./load-env";

loadEnv();

const ADMIN_URL = process.env.ADMIN_DATABASE_URL;
if (!ADMIN_URL) {
  console.error("ADMIN_DATABASE_URL must be set.");
  process.exit(1);
}

const url = new URL(ADMIN_URL);
const dbName = url.pathname.replace(/^\//, "");
const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";

if (!isLocal && process.env.ALLOW_DESTRUCTIVE_RESET !== "yes") {
  console.error(
    `Refusing to reset a non-local database (${url.hostname}/${dbName}).\n` +
      "Set ALLOW_DESTRUCTIVE_RESET=yes only if you are certain."
  );
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  await client.query("drop schema public cascade");
  await client.query("create schema public");
  await client.query("grant all on schema public to public");
  await client.end();
  console.log(`schema public reset in ${dbName}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
