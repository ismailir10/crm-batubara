import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Stripe-style KPI tile. Every tile links to the records behind it — the
 * specification forbids dead-end numbers on the dashboard (§9.1).
 */
export function StatTile({
  label,
  value,
  sublabel,
  href,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  href?: string;
  tone?: "default" | "warning" | "success";
  className?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="label-caps">{label}</p>
        {href ? (
          <ArrowUpRight className="size-3.5 shrink-0 text-ink-300 transition-colors group-hover:text-brand-500" />
        ) : null}
      </div>
      <p
        className={cn(
          "tnum mt-2 text-2xl font-semibold tracking-tight",
          tone === "warning" ? "text-warning-ink" : "text-ink-900"
        )}
      >
        {value}
      </p>
      {sublabel ? <p className="mt-1 text-[13px] text-ink-500">{sublabel}</p> : null}
    </>
  );

  const base = "block rounded-lg bg-white px-4 py-3.5 shadow-[var(--shadow-card)]";

  if (!href) {
    return <div className={cn(base, className)}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(base, "group transition-shadow hover:shadow-[var(--shadow-raised)]", className)}
    >
      {content}
    </Link>
  );
}

/** Horizontal planned-versus-delivered bar. */
export function ProgressBar({
  percent,
  className,
  tone = "brand",
}: {
  percent: number;
  className?: string;
  tone?: "brand" | "success";
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink-200", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full", tone === "success" ? "bg-success" : "bg-brand-500")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
