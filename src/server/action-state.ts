import { ZodError } from "zod";
import { isRlsDenial, isUniqueViolation } from "@/lib/pg-errors";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const IDLE: ActionState = { status: "idle" };

export function success(message: string): ActionState {
  return { status: "success", message };
}

export function failure(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { status: "error", message, fieldErrors };
}

/**
 * Turns a thrown error into a user-facing message. Anything unrecognised is
 * logged and reported generically — never leak a database error to the UI.
 */
export function toActionState(error: unknown): ActionState {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return failure("Periksa kembali isian yang ditandai.", fieldErrors);
  }

  if (isRlsDenial(error)) {
    return failure(
      "Anda tidak memiliki akses untuk tindakan ini. Tindakan ditolak oleh kebijakan keamanan basis data."
    );
  }

  if (isUniqueViolation(error)) {
    return failure("Data dengan nomor atau kode yang sama sudah ada.");
  }

  if (error instanceof Error) {
    const named = ["TransitionError", "ValidationError", "ForbiddenError", "AuthError"];
    if (named.includes(error.name)) {
      return failure(error.message);
    }
    console.error("[action]", error);
  } else {
    console.error("[action] unknown error", error);
  }

  return failure("Terjadi kesalahan pada sistem. Silakan coba lagi.");
}

/** Reads a FormData value as a trimmed string. */
export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
