/**
 * Chart data shaping and palette.
 *
 * Deliberately NOT a "use client" module: server components call `mergeSeries`
 * and read `SERIES_COLORS` while rendering. Exports of a client module are
 * client references on the server and cannot be invoked there.
 */

/** Four is the maximum shown at once, so the palette stays distinguishable. */
export const SERIES_COLORS = ["#635BFF", "#0E9AA7", "#C77405", "#CD3D64"] as const;

export interface MergedRow {
  date: string;
  [sourceCode: string]: string | number | null;
}

export interface OverlayRow {
  index: number;
  aPrice: number | null;
  bPrice: number | null;
  aDate: string | null;
  bDate: string | null;
}

/**
 * Merges per-source series onto a shared date axis. A date a source has no
 * observation for stays null and renders as a break in the line —
 * `connectNulls` is false everywhere, deliberately (specification §13).
 */
export function mergeSeries(
  series: Record<string, { date: string; price: number }[]>
): MergedRow[] {
  const byDate = new Map<string, MergedRow>();

  for (const [code, points] of Object.entries(series)) {
    for (const point of points) {
      const row = byDate.get(point.date) ?? { date: point.date };
      row[code] = point.price;
      byDate.set(point.date, row);
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
