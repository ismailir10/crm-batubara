"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileCheck2,
  FileSignature,
  LayoutDashboard,
  LineChart,
  Ship,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: null,
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Penjualan",
    items: [
      { href: "/prospek", label: "Prospek", icon: Building2 },
      { href: "/opportunity", label: "Opportunity", icon: Target },
      { href: "/persetujuan", label: "Persetujuan Penjualan", icon: FileCheck2 },
    ],
  },
  {
    label: "Pelaksanaan",
    items: [
      { href: "/kontrak", label: "Kontrak", icon: FileSignature },
      { href: "/delivery-order", label: "Delivery Order", icon: Ship },
    ],
  },
  {
    label: "Intelijen Pasar",
    items: [{ href: "/harga-batubara", label: "Harga Batubara", icon: LineChart }],
  },
] as const;

export function MainNav({ pendingApprovals }: { pendingApprovals: number }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5" aria-label="Navigasi utama">
      {GROUPS.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex}>
          {group.label ? (
            <p className="label-caps mb-1.5 px-2.5">{group.label}</p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                "exact" in item && item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-brand-50 font-semibold text-brand-700"
                      : "font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-brand-600" : "text-ink-400 group-hover:text-ink-600"
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.href === "/persetujuan" && pendingApprovals > 0 ? (
                    <span className="tnum rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning-ink">
                      {pendingApprovals}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
