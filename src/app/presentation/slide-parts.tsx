import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared slide furniture.
 *
 * Deliberately restrained: hairline rules, small caps labels, tabular figures,
 * no tinted pills, no filled number bubbles, no pastel cards. The audience is a
 * coal-business board, and the deck should read like a document prepared for
 * them rather than a product landing page.
 *
 * Colour still carries meaning — it is confined to a 2px keyline or the figure
 * itself, never a decorative fill.
 *
 * Screenshots are captured from the running application by
 * `npm run deck:capture`.
 *
 * Plain <img> rather than next/image throughout: these components are also
 * rendered to static HTML by `npm run deck:export`, outside Next entirely. The
 * captures are already sized for their slot, so there is nothing for the
 * optimizer to do.
 */

// --- brand ------------------------------------------------------------------

/**
 * Vendor mark. Used for attribution on the cover and closing slides only — this
 * is the vendor's logo, not the client's, so it does not belong in the product
 * chrome.
 */
export function RightjetMark({
  size = 28,
  onDark = false,
}: {
  size?: number;
  onDark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded",
        // The mark is dark indigo, so it needs a light plate on a dark slide.
        onDark ? "bg-white p-1.5" : ""
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/rightjet-logo.png"
        alt="Rightjet"
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    </span>
  );
}

export function VendorCredit({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <RightjetMark size={onDark ? 22 : 26} onDark={onDark} />
      <span className={cn("text-[15px]", onDark ? "text-ink-300" : "text-ink-600")}>
        Disiapkan oleh <span className="font-semibold">Rightjet</span>
      </span>
    </span>
  );
}

// --- status ------------------------------------------------------------------

const STATUS_CONFIG = {
  working: { label: "Berfungsi di demo", rule: "border-success" },
  proposed: { label: "Usulan / tahap lanjut", rule: "border-ink-300" },
  mock: { label: "Data sintetis (mock)", rule: "border-warning" },
} as const;

/**
 * Working / proposed / mock marker.
 *
 * A keyline and a small caps label, not a coloured pill with a dot. The
 * distinction still has to be unmissable — specification §18 requires every
 * slide to separate what works from what is proposed — but it should look like
 * a margin note, not a badge.
 */
export function StatusChip({
  kind,
  className,
}: {
  kind: keyof typeof STATUS_CONFIG;
  className?: string;
}) {
  const config = STATUS_CONFIG[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center border-l-2 pl-2.5 text-[11px] font-semibold tracking-[0.08em] text-ink-500 uppercase",
        config.rule,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function StatusRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-6 gap-y-2">{children}</div>;
}

// --- typography ---------------------------------------------------------------

export function SlideTitle({
  eyebrow,
  title,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-5" : "mb-9"}>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
        {eyebrow}
      </p>
      <h2
        className={cn(
          "leading-[1.15] font-semibold text-ink-900",
          compact ? "text-[30px]" : "text-[38px]"
        )}
      >
        {title}
      </h2>
      <div className="mt-4 h-px w-full bg-ink-200" />
    </div>
  );
}

/**
 * A point with a small icon set inline, rather than an icon floating in a
 * tinted rounded square.
 */
export function Bullet({
  icon: Icon,
  title,
  children,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children?: React.ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div className="flex gap-3.5">
      <Icon
        className={cn(
          "mt-1 size-[18px] shrink-0",
          tone === "danger"
            ? "text-danger"
            : tone === "success"
              ? "text-success"
              : "text-ink-400"
        )}
      />
      <div className="min-w-0">
        <p className="text-[17px] font-semibold text-ink-900">{title}</p>
        {children ? (
          <p className="mt-1 text-[16px] leading-snug text-ink-600">{children}</p>
        ) : null}
      </div>
    </div>
  );
}

/** A numbered annotation: a tabular numeral against a hairline, no bubble. */
export function Callout({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-l border-ink-200 pl-4">
      <p className="tnum mb-1 text-[11px] font-semibold tracking-[0.1em] text-brand-600">
        {String(index).padStart(2, "0")}
      </p>
      <p className="text-[15px] font-semibold text-ink-900">{title}</p>
      {children ? (
        <p className="mt-1 text-[14px] leading-snug text-ink-600">{children}</p>
      ) : null}
    </div>
  );
}

/** A headline figure quoted from the demo data. */
export function Figure({
  value,
  label,
  tone = "default",
}: {
  value: string;
  label: string;
  tone?: "default" | "up" | "down";
}) {
  return (
    <div className="border-t-2 border-ink-900 pt-3">
      <p
        className={cn(
          "tnum text-[27px] leading-none font-semibold",
          tone === "up" ? "text-success-ink" : tone === "down" ? "text-danger-ink" : "text-ink-900"
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[13px] leading-snug text-ink-600">{label}</p>
    </div>
  );
}

/** A panel whose meaning is carried by a single keyline, not a tinted fill. */
export function Panel({
  title,
  icon: Icon,
  tone = "neutral",
  children,
  className,
}: {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "danger" | "success" | "dark";
  children: React.ReactNode;
  className?: string;
}) {
  const rule = {
    neutral: "border-l-ink-300",
    danger: "border-l-danger",
    success: "border-l-success",
    dark: "border-l-brand-400",
  }[tone];

  return (
    <div
      className={cn(
        "border-l-2 pl-5",
        rule,
        tone === "dark" ? "text-ink-200" : "text-ink-700",
        className
      )}
    >
      {title ? (
        <p
          className={cn(
            "mb-3 flex items-center gap-2 text-[15px] font-semibold",
            tone === "dark" ? "text-white" : "text-ink-900"
          )}
        >
          {Icon ? <Icon className="size-4" /> : null}
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

// --- screenshots ---------------------------------------------------------------

/**
 * A screenshot in a plain frame.
 *
 * Cropping is expressed as an aspect ratio plus a vertical focus percentage
 * rather than a pixel offset. Slides scale the whole 1280×720 stage with a CSS
 * transform, so a pixel-based crop would drift the moment the image is sized to
 * its column — this stays correct at every scale.
 */
export function Screenshot({
  src,
  alt,
  width,
  height,
  className,
  ratio,
  focusY = 0,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  ratio?: number;
  focusY?: number;
}) {
  return (
    <figure className={cn("overflow-hidden rounded-sm ring-1 ring-ink-200", className)}>
      <div
        className="relative w-full overflow-hidden bg-white"
        style={ratio ? { aspectRatio: String(ratio) } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={ratio ? "h-full w-full object-cover" : "block h-auto w-full"}
          style={ratio ? { objectPosition: `50% ${focusY}%` } : undefined}
        />
      </div>
    </figure>
  );
}

/** Caption printed beneath a screenshot, naming the screen it came from. */
export function ScreenCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-[11px] tracking-[0.06em] text-ink-400 uppercase">
      Tangkapan layar aplikasi · {children}
    </p>
  );
}

/**
 * Wide product slide: headline, a full-width screenshot, then annotations in a
 * row beneath. Suits the short, wide captures.
 */
export function ProductSlideWide({
  eyebrow,
  title,
  src,
  alt,
  caption,
  imageWidth,
  imageHeight,
  imageClassName,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  src: string;
  alt: string;
  caption: string;
  imageWidth: number;
  imageHeight: number;
  imageClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col justify-center px-16">
      <SlideTitle eyebrow={eyebrow} title={title} compact />
      <Screenshot
        src={src}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        className={cn("mx-auto w-full", imageClassName)}
      />
      <ScreenCaption>{caption}</ScreenCaption>
      <div className="mt-6 grid grid-cols-3 gap-6">{children}</div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
}

/** Two-column product slide: annotations left, screenshot right. */
export function ProductSlide({
  eyebrow,
  title,
  src,
  alt,
  caption,
  imageWidth,
  imageHeight,
  // No default ratio: captures are already tight crops, so the natural aspect
  // is what should be shown. Forcing a ratio here silently trimmed the edges
  // off the contract table.
  ratio,
  focusY = 0,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  src: string;
  alt: string;
  caption: string;
  imageWidth: number;
  imageHeight: number;
  ratio?: number;
  focusY?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col justify-center px-16">
      <SlideTitle eyebrow={eyebrow} title={title} compact />
      <div className="grid grid-cols-[minmax(0,320px)_minmax(0,1fr)] items-start gap-10">
        <div className="space-y-5">
          {children}
          {footer ? <div className="pt-1">{footer}</div> : null}
        </div>
        <div>
          <Screenshot
            src={src}
            alt={alt}
            width={imageWidth}
            height={imageHeight}
            ratio={ratio}
            focusY={focusY}
          />
          <ScreenCaption>{caption}</ScreenCaption>
        </div>
      </div>
    </div>
  );
}
