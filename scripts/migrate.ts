/**
 * Applies SQL migrations in filename order, once each, tracked in schema_migrations.
 * Forward-only. Runs as the database owner via ADMIN_DATABASE_URL.
 *
 *   npm run db:migrate
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { loadEnv } from "./load-env";

loadEnv();

const ADMIN_URL = process.env.ADMIN_DATABASE_URL;
if (!ADMIN_URL) {
  console.error("ADMIN_DATABASE_URL must be set.");
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

async function main() {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();

  await client.query(`
    create table if not exists schema_migrations (
      filename   text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const applied = new Set(
    (await client.query<{ filename: string }>("select filename from schema_migrations")).rows.map(
      (r) => r.filename
    )
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip   ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (filename) values ($1)", [file]);
      await client.query("commit");
      console.log(`apply  ${file}`);
      count += 1;
    } catch (error) {
      await client.query("rollback");
      console.error(`FAILED ${file}`);
      throw error;
    }
  }

  await client.end();
  console.log(count === 0 ? "database already up to date" : `${count} migration(s) applied`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
