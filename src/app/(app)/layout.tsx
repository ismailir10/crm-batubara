import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Presentation } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { countPendingApprovals } from "@/server/repos/approvals";
import { logoutAction } from "@/server/actions/auth";
import { MainNav } from "@/components/main-nav";
import { ROLE_LABEL } from "@/domain/status";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const pendingApprovals = await countPendingApprovals();

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-ink-200/70 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex size-7 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
            CB
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink-900">CRM Batubara</p>
            <p className="truncate text-[11px] text-ink-500">Prototipe demo</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <MainNav pendingApprovals={pendingApprovals} />
        </div>

        <div className="border-t border-ink-200/70 p-2">
          <Link
            href="/presentation"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <Presentation className="size-4 text-ink-400" />
            Materi Presentasi
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-ink-200/70 bg-white/90 px-4 backdrop-blur-sm lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
              CB
            </div>
            <span className="text-[13px] font-semibold text-ink-900">CRM Batubara</span>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-warning-soft px-3 py-1 lg:flex">
            <span className="size-1.5 rounded-full bg-warning" />
            <span className="text-[11px] font-semibold tracking-wide text-warning-ink uppercase">
              Data demo — sintetis
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-medium text-ink-900">{user.fullName}</p>
              {/* Bagus Setiawan's job title is literally "Sales Manager", which
                  matched the role label and rendered as "Sales Manager · Sales
                  Manager". Show the role only when it adds something. */}
              <p className="text-[11px] text-ink-500">
                {user.jobTitle && user.jobTitle !== ROLE_LABEL[user.role]
                  ? `${user.jobTitle} · ${ROLE_LABEL[user.role]}`
                  : ROLE_LABEL[user.role]}
              </p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
              {initials(user.fullName)}
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Keluar" title="Keluar">
                <LogOut />
              </Button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
