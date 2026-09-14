/**
 * Coal price comparison engine (specification §13).
 *
 * Pure functions over observations, unit-tested independently of the database.
 *
 * Rule that governs this whole module: missing days are gaps, never interpolated.
 * Weekends, holidays and failed fetches produce no point. An invented price in a
 * price intelligence tool is the one bug that would destroy trust in it.
 */

export interface PricePoint {
  /** ISO date, YYYY-MM-DD */
  date: string;
  price: number;
}

export interface PeriodSummary {
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
  first: PricePoint | null;
  last: PricePoint | null;
  /** last - first, across the period */
  changeAbsolute: number | null;
  changePercent: number | null;
}

export const EMPTY_SUMMARY: PeriodSummary = {
  count: 0,
  average: null,
  min: null,
  max: null,
  first: null,
  last: null,
  changeAbsolute: null,
  changePercent: null,
};

export function summarise(points: PricePoint[]): PeriodSummary {
  if (points.length === 0) return { ...EMPTY_SUMMARY };

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const prices = sorted.map((p) => p.price);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const changeAbsolute = round2(last.price - first.price);

  return {
    count: sorted.length,
    average: round2(prices.reduce((s, p) => s + p, 0) / prices.length),
    min: round2(Math.min(...prices)),
    max: round2(Math.max(...prices)),
    first,
    last,
    changeAbsolute,
    changePercent: first.price === 0 ? null : round2((changeAbsolute / first.price) * 100),
  };
}

export interface PeriodComparison {
  a: PeriodSummary;
  b: PeriodSummary;
  /**
   * Period A measured against period B: `a - b`.
   *
   * Direction matters and is easy to get backwards. A is the period the user is
   * asking about (typically the current one); B is the baseline being compared
   * against. A negative value therefore means "A is lower than B" — today's
   * price is below the comparison period. The UI must state this direction
   * explicitly rather than showing a bare signed number.
   */
  averageDelta: number | null;
  averagePercent: number | null;
  minDelta: number | null;
  maxDelta: number | null;
  /** Aligned by position within each period, for overlaying series of unequal length. */
  overlay: OverlayPoint[];
}

export interface OverlayPoint {
  index: number;
  aDate: string | null;
  aPrice: number | null;
  bDate: string | null;
  bPrice: number | null;
}

/**
 * Compares two arbitrary periods. Periods of different length are aligned by
 * day index rather than by calendar date, which is what makes "Q1 this year vs
 * Q1 three years ago" readable on one chart.
 */
export function comparePeriods(pointsA: PricePoint[], pointsB: PricePoint[]): PeriodComparison {
  const a = summarise(pointsA);
  const b = summarise(pointsB);

  const sortedA = [...pointsA].sort((x, y) => x.date.localeCompare(y.date));
  const sortedB = [...pointsB].sort((x, y) => x.date.localeCompare(y.date));
  const length = Math.max(sortedA.length, sortedB.length);

  const overlay: OverlayPoint[] = [];
  for (let i = 0; i < length; i += 1) {
    overlay.push({
      index: i + 1,
      aDate: sortedA[i]?.date ?? null,
      aPrice: sortedA[i]?.price ?? null,
      bDate: sortedB[i]?.date ?? null,
      bPrice: sortedB[i]?.price ?? null,
    });
  }

  const averageDelta = delta(a.average, b.average);

  return {
    a,
    b,
    averageDelta,
    // Percentage is relative to B, the baseline being compared against.
    averagePercent:
      b.average === null || b.average === 0 || averageDelta === null
        ? null
        : round2((averageDelta / b.average) * 100),
    minDelta: delta(a.min, b.min),
    maxDelta: delta(a.max, b.max),
    overlay,
  };
}

export interface YearComparisonRow {
  year: number;
  from: string;
  to: string;
  summary: PeriodSummary;
  /** Difference in average against the most recent year in the set. */
  averageDeltaVsLatest: number | null;
  averagePercentVsLatest: number | null;
}

/**
 * Same calendar window across several years — the MoM's stated need:
 * "membandingkan harga saat ini dengan harga 3 tahun sebelumnya".
 */
export function compareYears(
  pointsByYear: Map<number, PricePoint[]>,
  window: { fromMonthDay: string; toMonthDay: string }
): YearComparisonRow[] {
  const years = [...pointsByYear.keys()].sort((a, b) => b - a);
  if (years.length === 0) return [];

  const latestYear = years[0];
  const latestAverage = summarise(pointsByYear.get(latestYear) ?? []).average;

  return years.map((year) => {
    const summary = summarise(pointsByYear.get(year) ?? []);
    const averageDeltaVsLatest =
      year === latestYear ? 0 : delta(latestAverage, summary.average);
    return {
      year,
      from: `${year}-${window.fromMonthDay}`,
      to: `${year}-${window.toMonthDay}`,
      summary,
      averageDeltaVsLatest,
      averagePercentVsLatest:
        summary.average === null || summary.average === 0 || averageDeltaVsLatest === null
          ? null
          : round2((averageDeltaVsLatest / summary.average) * 100),
    };
  });
}

/**
 * Today plus the previous seven days — the primary view required by the MoM.
 * Returns whatever exists in that window; missing days are simply absent.
 */
export function sevenDayWindow(points: PricePoint[], asOf: Date): PricePoint[] {
  const to = toIsoDate(asOf);
  const fromDate = new Date(asOf);
  fromDate.setUTCDate(fromDate.getUTCDate() - 7);
  const from = toIsoDate(fromDate);
  return points
    .filter((p) => p.date >= from && p.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Change between the latest point and the one closest to `days` ago. */
export function trailingChange(points: PricePoint[], days: number) {
  if (points.length === 0) return { latest: null, previous: null, absolute: null, percent: null };
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  const target = new Date(`${latest.date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() - days);
  const targetIso = toIsoDate(target);

  // Nearest observation at or before the target date; no invented point.
  const previous = [...sorted].reverse().find((p) => p.date <= targetIso) ?? sorted[0];

  if (previous.date === latest.date) {
    return { latest, previous: null, absolute: null, percent: null };
  }
  const absolute = round2(latest.price - previous.price);
  return {
    latest,
    previous,
    absolute,
    percent: previous.price === 0 ? null : round2((absolute / previous.price) * 100),
  };
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function delta(x: number | null, y: number | null): number | null {
  if (x === null || y === null) return null;
  return round2(x - y);
}
