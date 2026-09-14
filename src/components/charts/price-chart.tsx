"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateAxis, formatDate } from "@/lib/format";
import { SERIES_COLORS, type MergedRow, type OverlayRow } from "./chart-data";

const AXIS_STYLE = { fontSize: 11, fill: "#697386" } as const;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md bg-white px-3 py-2 shadow-[var(--shadow-raised)]">
      <p className="mb-1.5 text-[11px] font-semibold text-ink-900">{formatDate(label)}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-[11px]">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-ink-600">{entry.name}</span>
            <span className="tnum ml-auto font-semibold text-ink-900">
              {entry.value?.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-ink-400">USD/tonne · data sintetis</p>
    </div>
  );
}

export function PriceTrendChart({
  data,
  sourceCodes,
  height = 300,
}: {
  data: MergedRow[];
  sourceCodes: string[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid stroke="#E3E8EE" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateAxis}
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={{ stroke: "#E3E8EE" }}
          minTickGap={40}
        />
        <YAxis
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={["auto", "auto"]}
          tickFormatter={(value: number) => value.toLocaleString("id-ID")}
        />
        <Tooltip content={<ChartTooltip />} />
        {sourceCodes.map((code, index) => (
          <Line
            key={code}
            type="monotone"
            dataKey={code}
            name={code}
            stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 0 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Two periods aligned by day index, so unequal-length ranges overlay cleanly. */
export function PeriodOverlayChart({
  data,
  labelA,
  labelB,
  height = 280,
}: {
  data: OverlayRow[];
  labelA: string;
  labelB: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid stroke="#E3E8EE" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="index"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={{ stroke: "#E3E8EE" }}
          minTickGap={30}
          label={{
            value: "Hari ke-",
            position: "insideBottomRight",
            offset: -2,
            style: { fontSize: 10, fill: "#8792A2" },
          }}
        />
        <YAxis
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={["auto", "auto"]}
          tickFormatter={(value: number) => value.toLocaleString("id-ID")}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as OverlayRow;
            return (
              <div className="rounded-md bg-white px-3 py-2 shadow-[var(--shadow-raised)]">
                <p className="mb-1.5 text-[11px] font-semibold text-ink-900">
                  Hari ke-{row.index}
                </p>
                <div className="space-y-1 text-[11px]">
                  <OverlayTooltipRow
                    color={SERIES_COLORS[0]}
                    label={labelA}
                    date={row.aDate}
                    price={row.aPrice}
                  />
                  <OverlayTooltipRow
                    color={SERIES_COLORS[2]}
                    label={labelB}
                    date={row.bDate}
                    price={row.bPrice}
                  />
                </div>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="aPrice"
          name={labelA}
          stroke={SERIES_COLORS[0]}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="bPrice"
          name={labelB}
          stroke={SERIES_COLORS[2]}
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function OverlayTooltipRow({
  color,
  label,
  date,
  price,
}: {
  color: string;
  label: string;
  date: string | null;
  price: number | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-ink-600">{label}</span>
      <span className="tnum ml-auto font-semibold text-ink-900">
        {price === null ? "—" : price.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
      </span>
      {date ? <span className="text-[10px] text-ink-400">({formatDateAxis(date)})</span> : null}
    </div>
  );
}

/** Compact sparkline for dashboard price tiles. */
export function Sparkline({
  data,
  color = SERIES_COLORS[0],
  height = 36,
}: {
  data: { date: string; price: number }[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.75}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
