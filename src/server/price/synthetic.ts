/**
 * Synthetic coal price generation.
 *
 * Single source of truth for the demo series: both the database seed and the
 * mock provider adapter import from here, so the two can never drift apart.
 *
 * Deterministic by construction — the series depends only on the source code and
 * a fixed anchor date, never on when the code runs. Re-seeding reproduces
 * identical data (AGENTS.md §9).
 *
 * These are invented values shaped to resemble the real 2021–2022 energy price
 * surge and its normalisation. They are not market data and are labelled as
 * such everywhere they appear.
 */

export const PRICE_ANCHOR_DATE = "2019-01-01";

export interface SyntheticSource {
  code: string;
  name: string;
  provider: string;
  region: "Singapore" | "China";
  specLabel: string;
  sortOrder: number;
  /** Control points interpolated linearly: [ISO date, USD/tonne] */
  trend: [string, number][];
  volatility: number;
}

/** Two Singapore sources and two China sources, matching the MoM (decision D-015). */
export const SYNTHETIC_SOURCES: SyntheticSource[] = [
  {
    code: "ICI-3",
    name: "Indonesian Coal Index 3",
    provider: "Coal Index Data Service (Singapore)",
    region: "Singapore",
    specLabel: "GAR 4200 kcal/kg",
    sortOrder: 1,
    volatility: 0.018,
    trend: [
      ["2019-01-01", 41],
      ["2020-01-01", 36],
      ["2020-09-01", 30],
      ["2021-06-01", 55],
      ["2021-10-01", 88],
      ["2022-03-01", 112],
      ["2022-09-01", 98],
      ["2023-03-01", 72],
      ["2023-12-01", 58],
      ["2024-09-01", 52],
      ["2025-06-01", 49],
      ["2026-09-01", 54],
      ["2027-12-31", 56],
    ],
  },
  {
    code: "ICI-4",
    name: "Indonesian Coal Index 4",
    provider: "Coal Index Data Service (Singapore)",
    region: "Singapore",
    specLabel: "GAR 3400 kcal/kg",
    sortOrder: 2,
    volatility: 0.02,
    trend: [
      ["2019-01-01", 30],
      ["2020-01-01", 26],
      ["2020-09-01", 21],
      ["2021-06-01", 39],
      ["2021-10-01", 62],
      ["2022-03-01", 78],
      ["2022-09-01", 69],
      ["2023-03-01", 52],
      ["2023-12-01", 43],
      ["2024-09-01", 39],
      ["2025-06-01", 37],
      ["2026-09-01", 41],
      ["2027-12-31", 42],
    ],
  },
  {
    code: "CCI-5500",
    name: "China Coal Index 5500",
    provider: "China Coal Market Data (Beijing)",
    region: "China",
    specLabel: "NAR 5500 kcal/kg",
    sortOrder: 3,
    volatility: 0.022,
    trend: [
      ["2019-01-01", 88],
      ["2020-01-01", 80],
      ["2020-09-01", 74],
      ["2021-06-01", 135],
      ["2021-10-01", 240],
      ["2022-03-01", 205],
      ["2022-09-01", 178],
      ["2023-03-01", 148],
      ["2023-12-01", 126],
      ["2024-09-01", 118],
      ["2025-06-01", 112],
      ["2026-09-01", 119],
      ["2027-12-31", 121],
    ],
  },
  {
    code: "QHD-5500",
    name: "Qinhuangdao Spot 5500",
    provider: "North China Port Index (Qinhuangdao)",
    region: "China",
    specLabel: "NAR 5500 kcal/kg",
    sortOrder: 4,
    volatility: 0.025,
    trend: [
      ["2019-01-01", 92],
      ["2020-01-01", 83],
      ["2020-09-01", 78],
      ["2021-06-01", 142],
      ["2021-10-01", 255],
      ["2022-03-01", 198],
      ["2022-09-01", 172],
      ["2023-03-01", 143],
      ["2023-12-01", 122],
      ["2024-09-01", 115],
      ["2025-06-01", 109],
      ["2026-09-01", 116],
      ["2027-12-31", 118],
    ],
  },
];

export interface SyntheticPoint {
  date: string;
  price: number;
}

function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function trendValue(source: SyntheticSource, date: Date): number {
  const points = source.trend.map(([d, v]) => ({ time: Date.parse(`${d}T00:00:00Z`), value: v }));
  const t = date.getTime();
  if (t <= points[0].time) return points[0].value;
  for (let i = 1; i < points.length; i += 1) {
    if (t <= points[i].time) {
      const previous = points[i - 1];
      const current = points[i];
      const ratio = (t - previous.time) / (current.time - previous.time);
      return previous.value + (current.value - previous.value) * ratio;
    }
  }
  return points[points.length - 1].value;
}

/** Fixed public holidays, skipped alongside weekends so the series has real gaps. */
const HOLIDAY_MONTH_DAYS = new Set(["01-01", "05-01", "08-17", "12-25"]);

export function isTradingDay(date: Date): boolean {
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  return !HOLIDAY_MONTH_DAYS.has(isoOf(date).slice(5));
}

/**
 * Mean-reverting walk over trading days from the anchor to `until`, inclusive.
 * Weekends and holidays produce no point at all — gaps stay gaps, and nothing
 * downstream interpolates them.
 */
export function generateSeries(source: SyntheticSource, until: Date): SyntheticPoint[] {
  const random = mulberry32(hashSeed(source.code));
  const points: SyntheticPoint[] = [];
  let deviation = 0;

  let cursor = new Date(`${PRICE_ANCHOR_DATE}T00:00:00Z`);
  while (cursor <= until) {
    if (isTradingDay(cursor)) {
      deviation = deviation * 0.88 + (random() * 2 - 1) * source.volatility;
      const price = trendValue(source, cursor) * (1 + deviation);
      points.push({ date: isoOf(cursor), price: Math.round(price * 100) / 100 });
    }
    cursor = addDays(cursor, 1);
  }
  return points;
}
