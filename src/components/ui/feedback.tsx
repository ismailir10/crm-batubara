import { AlertTriangle, CheckCircle2, Info, Inbox } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Empty, error and success states (specification §17). Empty states say what to
 * do next rather than "tidak ada data".
 */

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-3 rounded-full bg-ink-100 p-2.5">
        <Icon className="size-5 text-ink-400" />
      </div>
      <p className="text-[13px] font-semibold text-ink-900">{title}</p>
      <p className="mt-1 max-w-md text-[13px] text-ink-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

type AlertVariant = "info" | "success" | "warning" | "danger";

const ALERT_STYLE: Record<
  AlertVariant,
  { wrap: string; icon: React.ComponentType<{ className?: string }> }
> = {
  info: { wrap: "bg-info-soft text-info-ink", icon: Info },
  success: { wrap: "bg-success-soft text-success-ink", icon: CheckCircle2 },
  warning: { wrap: "bg-warning-soft text-warning-ink", icon: AlertTriangle },
  danger: { wrap: "bg-danger-soft text-danger-ink", icon: AlertTriangle },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const style = ALERT_STYLE[variant];
  const Icon = style.icon;
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn("flex gap-2.5 rounded-md px-3.5 py-2.5 text-[13px]", style.wrap, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5")}>{children}</div> : null}
      </div>
    </div>
  );
}

/** Skeleton block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-ink-200", className)} />;
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="px-5 py-4">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={cn("h-4 flex-1", columnIndex === 0 && "flex-[2]")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
