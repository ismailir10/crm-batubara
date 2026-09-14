import Link from "next/link";
import { ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-[13px]">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <ChevronRight className="size-3.5 text-ink-300" /> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="text-ink-500 hover:text-brand-600">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink-500">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
          {description ? <p className="mt-1 text-[13px] text-ink-500">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
