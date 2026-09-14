import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Stripe-style data table: no vertical rules, hairline row separators, small
 * uppercase column labels, whole-row hover. Figures right-aligned and tabular.
 */

export function TableWrapper({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-x-auto", className)} {...props} />;
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-[13px]", className)} {...props} />;
}

export function Th({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        "label-caps border-b border-ink-200/70 px-4 py-2 whitespace-nowrap",
        numeric ? "text-right" : "text-left",
        className
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-ink-200/50 px-4 py-2.5 align-middle text-ink-700",
        numeric ? "tnum text-right" : "text-left",
        className
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-ink-50", className)} {...props} />;
}
