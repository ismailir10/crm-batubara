import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/domain/status";

/**
 * Stripe-style pill badge: soft tinted background, darker ink of the same hue,
 * fully rounded, 12px semibold. One colour per status meaning, used identically
 * everywhere, so the reader learns the vocabulary once.
 */
const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  info: "bg-info-soft text-info-ink",
  warning: "bg-warning-soft text-warning-ink",
  success: "bg-success-soft text-success-ink",
  danger: "bg-danger-soft text-danger-ink",
};

const DOT_CLASS: Record<Tone, string> = {
  neutral: "bg-ink-400",
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
  danger: "bg-danger",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        TONE_CLASS[tone],
        className
      )}
      {...props}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", DOT_CLASS[tone])} /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({
  meta,
  dot = true,
  className,
}: {
  meta: { label: string; tone: Tone } | undefined;
  dot?: boolean;
  className?: string;
}) {
  if (!meta) return <Badge className={className}>—</Badge>;
  return (
    <Badge tone={meta.tone} dot={dot} className={className}>
      {meta.label}
    </Badge>
  );
}
