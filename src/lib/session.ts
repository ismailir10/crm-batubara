import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { withUser, withoutUser } from "./db";
import type { SessionUser, UserRole } from "@/domain/types";

/**
 * Session handling: an HMAC-signed, httpOnly cookie carrying a user id and an
 * expiry. No third-party auth dependency — production would replace this module
 * with the company's internal SSO or Active Directory (specification §15).
 */

const COOKIE_NAME = "crm_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

interface SessionPayload {
  uid: string;
  exp: number;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value === "CHANGE_ME") {
    throw new Error(
      "SESSION_SECRET belum diatur. Salin .env.example ke .env.local dan isi nilainya."
    );
  }
  return value;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encode({ uid: userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Current user, or null. Cached per request so repeated calls across a page's
 * server components hit the database once.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = decode(token);
  if (!payload) return null;

  const row = await withoutUser(async (client) => {
    const result = await client.query<{
      id: string;
      email: string;
      full_name: string;
      job_title: string | null;
      role: UserRole;
    }>("select id, email, full_name, job_title, role from app_session_user($1)", [payload.uid]);
    return result.rows[0] ?? null;
  });

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    jobTitle: row.job_title,
    role: row.role,
  };
});

export class AuthError extends Error {
  constructor(message = "Sesi tidak ditemukan. Silakan masuk kembali.") {
    super(message);
    this.name = "AuthError";
  }
}

/** Throws if there is no session. Use in server actions and protected pages. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError();
  return user;
}

/**
 * Runs a query as the current user. RLS is the backstop; this is the first gate.
 */
export async function query<T>(fn: Parameters<typeof withUser<T>>[1]): Promise<T> {
  const user = await requireUser();
  return withUser(user.id, fn);
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError("Anda tidak memiliki akses untuk tindakan ini.");
  }
  return user;
}
