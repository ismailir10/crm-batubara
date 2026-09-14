import { execFileSync } from "node:child_process";

/**
 * Re-seeds the database before the end-to-end suite.
 *
 * The journey tests approve and reject forms, which consumes the pending
 * approvals in the seed. Without a reset they pass once and then fail on a
 * second run — exactly the kind of flakiness that erodes trust in a suite.
 *
 * Safe because the seed is deterministic and entirely synthetic (AGENTS.md §9).
 */
export default function globalSetup() {
  execFileSync("npm", ["run", "db:seed"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}
