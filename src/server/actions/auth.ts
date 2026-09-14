"use server";

import { redirect } from "next/navigation";
import { withoutUser } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema } from "@/domain/schemas";
import type { UserRole } from "@/domain/types";
import { failure, field, toActionState, type ActionState } from "../action-state";

export async function loginAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string | null = null;

  try {
    const input = loginSchema.parse({
      email: field(formData, "email"),
      password: field(formData, "password"),
    });

    const row = await withoutUser(async (client) => {
      const result = await client.query<{
        id: string;
        password_hash: string;
        is_active: boolean;
        role: UserRole;
      }>("select id, password_hash, is_active, role from app_login_lookup($1)", [input.email]);
      return result.rows[0] ?? null;
    });

    // Identical message for unknown email and wrong password: do not reveal
    // which addresses exist.
    const invalid = failure("Email atau kata sandi tidak sesuai.");
    if (!row || !row.is_active) return invalid;

    const valid = await verifyPassword(input.password, row.password_hash);
    if (!valid) return invalid;

    await createSession(row.id);
    userId = row.id;
  } catch (error) {
    return toActionState(error);
  }

  // redirect() throws by design, so it must sit outside the try block.
  if (userId) redirect("/");
  return failure("Terjadi kesalahan pada sistem. Silakan coba lagi.");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/masuk");
}
