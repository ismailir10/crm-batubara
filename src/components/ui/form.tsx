import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("block text-[13px] font-medium text-ink-700", className)}
      {...props}
    >
      {children}
      {required ? <span className="ml-0.5 text-danger">*</span> : null}
    </label>
  );
}

/**
 * Stripe-style input: hairline ring instead of a border, inner shadow for depth,
 * brand ring on focus.
 */
const fieldBase =
  "w-full rounded-md bg-white px-2.5 text-[13px] text-ink-900 placeholder:text-ink-400 " +
  "shadow-[0_0_0_1px_rgb(10_37_64/0.10),0_1px_1px_rgb(10_37_64/0.04)] " +
  "transition-shadow focus:outline-none " +
  "focus:shadow-[0_0_0_1px_var(--color-brand-500),0_0_0_3px_rgb(99_91_255/0.16)] " +
  "disabled:bg-ink-50 disabled:text-ink-400";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-8", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-24 resize-y py-2", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "h-8 pr-7", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-danger-ink">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

/** Read-only label/value pair used on detail pages. */
export function DataItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="mt-1 text-[13px] text-ink-900">{children}</dd>
    </div>
  );
}
