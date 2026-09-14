/**
 * Postgres error-code checks.
 *
 * Deliberately free of any `pg` import: this module is reachable from client
 * components (via the shared action-state types), and importing the driver here
 * would pull the whole of `pg` into the browser bundle.
 */

/** 42501 insufficient_privilege — an RLS policy refused the write. */
export function isRlsDenial(error: unknown): boolean {
  return (error as { code?: string })?.code === "42501";
}

/** 23505 unique_violation. */
export function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === "23505";
}
