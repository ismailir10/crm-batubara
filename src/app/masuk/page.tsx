import { redirect } from "next/navigation";
import Link from "next/link";
import { Presentation } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./login-form";
import { Alert } from "@/components/ui/feedback";

export const metadata = { title: "Masuk" };

const DEMO_ACCOUNTS = [
  { email: "dewi.anggraini@demo-batubara.co.id", role: "Marketing" },
  { email: "bagus.setiawan@demo-batubara.co.id", role: "Sales Manager" },
  { email: "hendra.wijaya@demo-batubara.co.id", role: "Manajemen (approver)" },
];

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-base font-bold text-white shadow-[var(--shadow-brand)]">
            CB
          </div>
          <h1 className="text-xl font-semibold text-ink-900">CRM Batubara</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Sistem terintegrasi penjualan, kontrak, dan intelijen harga batubara
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-[var(--shadow-raised)]">
          <LoginForm />
        </div>

        <div className="mt-5 space-y-3">
          <Alert variant="warning" title="Lingkungan demonstrasi">
            Seluruh data dalam sistem ini bersifat sintetis dan tidak mewakili data komersial
            yang sebenarnya.
          </Alert>

          <div className="rounded-md bg-white px-4 py-3 shadow-[var(--shadow-card)]">
            <p className="label-caps">Akun demo</p>
            <ul className="mt-2 space-y-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <li
                  key={account.email}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
                  <code className="truncate text-ink-800">{account.email}</code>
                  <span className="shrink-0 text-ink-500">{account.role}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-500">
              Kata sandi untuk seluruh akun demo: <code className="text-ink-800">demo1234</code>
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/presentation"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              <Presentation className="size-3.5" />
              Buka materi presentasi
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
