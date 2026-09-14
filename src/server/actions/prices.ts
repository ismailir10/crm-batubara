"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { runIngestion } from "../price/ingest";
import { failure, success, toActionState, type ActionState } from "../action-state";

/**
 * Manual trigger for the mock ingestion adapter. Idempotent — running it twice
 * produces no duplicates, which is demonstrable live (AC-22).
 */
export async function runIngestionAction(): Promise<ActionState> {
  try {
    await requireUser();
    const results = await runIngestion({ days: 14 });

    const failed = results.filter((r) => r.status === "gagal");
    const inserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const updated = results.reduce((sum, r) => sum + r.updated, 0);

    revalidatePath("/harga-batubara");
    revalidatePath("/");

    if (failed.length > 0) {
      return failure(
        `Pengambilan selesai sebagian: ${failed.length} dari ${results.length} sumber gagal. ` +
          failed.map((f) => `${f.sourceCode}: ${f.message}`).join("; ")
      );
    }

    return success(
      `Pengambilan berhasil dari ${results.length} sumber — ${inserted} baris baru, ` +
        `${updated} baris diperbarui. Menjalankan ulang tidak menduplikasi data.`
    );
  } catch (error) {
    return toActionState(error);
  }
}
