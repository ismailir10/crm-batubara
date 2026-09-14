/**
 * Display formatting. Indonesian locale throughout (specification §17).
 *
 * The IDR rate is a fixed, labelled demo constant — this prototype has no FX
 * feed and must not imply one (decision D-005).
 */
export const DEMO_USD_IDR_RATE = 16_250;

const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatTonnes(value: number | null | undefined, withUnit = true): string {
  if (value === null || value === undefined) return "—";
  return `${numberFormat.format(Math.round(value))}${withUnit ? " MT" : ""}`;
}

export function formatUsd(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "—";
  const formatted =
    decimals === 0 ? numberFormat.format(Math.round(value)) : decimalFormat.format(value);
  return `USD ${formatted}`;
}

/** Compact USD for dashboard tiles: USD 16,35 jt. */
export function formatUsdCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `USD ${decimalFormat.format(value / 1_000_000)} jt`;
  }
  if (abs >= 1_000) {
    return `USD ${decimalFormat.format(value / 1_000)} rb`;
  }
  return `USD ${decimalFormat.format(value)}`;
}

export function formatIdrEquivalent(usd: number | null | undefined): string {
  if (usd === null || usd === undefined) return "—";
  const idr = usd * DEMO_USD_IDR_RATE;
  if (Math.abs(idr) >= 1_000_000_000) {
    return `± Rp ${decimalFormat.format(idr / 1_000_000_000)} miliar`;
  }
  if (Math.abs(idr) >= 1_000_000) {
    return `± Rp ${decimalFormat.format(idr / 1_000_000)} juta`;
  }
  return `± Rp ${numberFormat.format(idr)}`;
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${decimalFormat.format(value)}`;
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function formatSignedPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPercent(value, decimals)}`;
}

export function formatSignedUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${decimalFormat.format(Math.abs(value))}`;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "14 September 2026" from an ISO date string, without timezone drift. */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "—";
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function formatDateShort(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "—";
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

/** Chart axis labels: "14 Sep". */
export function formatDateAxis(isoDate: string): string {
  const [, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!month || !day) return isoDate;
  return `${day} ${MONTHS_SHORT[month - 1]}`;
}

export function formatDateTime(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return "—";
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(date.toISOString())}, ${date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })} WIB`;
}

export function relativeDays(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const today = new Date(new Date().toISOString().slice(0, 10));
  const target = new Date(isoDate.slice(0, 10));
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "hari ini";
  if (diff === 1) return "besok";
  if (diff === -1) return "kemarin";
  if (diff > 0) return `${diff} hari lagi`;
  return `${Math.abs(diff)} hari lalu`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
