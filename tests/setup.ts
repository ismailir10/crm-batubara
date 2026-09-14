import fs from "node:fs";
import path from "node:path";

// Integration tests need DATABASE_URL / ADMIN_DATABASE_URL; unit tests do not.
for (const file of [".env.local", ".env"]) {
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) {
    process.loadEnvFile(full);
  }
}
