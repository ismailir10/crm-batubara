"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { loginAction } from "@/server/actions/auth";
import { IDLE } from "@/server/action-state";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        "Memproses…"
      ) : (
        <>
          <LogIn />
          Masuk
        </>
      )}
    </Button>
  );
}

export function LoginForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction] = useActionState(loginAction, IDLE);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? (
        <Alert variant="danger">{state.message}</Alert>
      ) : null}

      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={defaultEmail}
          placeholder="nama@demo-batubara.co.id"
          required
        />
      </Field>

      <Field label="Kata Sandi" htmlFor="password" required error={state.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
