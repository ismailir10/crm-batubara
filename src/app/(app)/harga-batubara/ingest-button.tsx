"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { runIngestionAction } from "@/server/actions/prices";
import type { ActionState } from "@/server/action-state";

/**
 * Manual trigger for the mock adapter. Running it twice is safe and is worth
 * doing live: the row count does not change, which demonstrates idempotency.
 */
export function IngestButton() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  function run() {
    startTransition(async () => {
      const result = await runIngestionAction();
      setState(result);
    });
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" size="sm" onClick={run} disabled={pending}>
        <RefreshCw className={pending ? "animate-spin" : undefined} />
        {pending ? "Mengambil data…" : "Jalankan Pengambilan Data"}
      </Button>

      {state && state.message ? (
        <Alert variant={state.status === "success" ? "success" : "danger"}>{state.message}</Alert>
      ) : null}
    </div>
  );
}
