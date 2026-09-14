import fs from "node:fs";
import path from "node:path";

/**
 * Loads .env.local then .env for standalone scripts. Next.js does this itself;
 * scripts run outside it, so they call this.
 */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(process.cwd(), file);
    if (fs.existsSync(full)) {
      process.loadEnvFile(full);
    }
  }
}
