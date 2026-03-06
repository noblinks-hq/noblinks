"use client";

import React from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DbWidget } from "@/lib/types";

// ── Placeholder data ──────────────────────────────────────────────────────────

const PH_TIMESERIES = Array.from({ length: 20 }, (_, i) => ({ t: i, v: null as number | null }));
const PH_BAR     = [{ name: "a", v: 72 }, { name: "b", v: 45 }, { name: "c", v: 88 }, { name: "d", v: 33 }, { name: "e", v: 61 }];
const PH_PIE     = [{ name: "A", value: 45 }, { name: "B", value: 30 }, { name: "C", value: 15 }, { name: "D", value: 10 }];
const PH_TOPLIST = [{ name: "process-1", v: 88 }, { name: "process-2", v: 61 }, { name: "process-3", v: 45 }, { name: "process-4", v: 33 }, { name: "process-5", v: 12 }];

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: "12px",
};

const NO_DATA_OVERLAY = (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <p className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
      Waiting for live data
    </p>
  </div>
);

// ── Data types ────────────────────────────────────────────────────────────────

export interface DataPoint { t: string; v: number }

// ── Data fetching hook ────────────────────────────────────────────────────────

export function useWidgetData(dashboardId: string, widgetId: string) {
  const [points, setPoints] = React.useState<DataPoint[]>([]);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/dashboards/${dashboardId}/widgets/${widgetId}/data`);
        if (res.ok && active) {
          const data = (await res.json()) as { points: DataPoint[] };
          setPoints(data.points);
        }
      } catch { /* network error — keep previous data */ }
    }

    void load();
    const interval = setInterval(() => { void load(); }, 30_000);
    return () => { active = false; clearInterval(interval); };
  }, [dashboardId, widgetId]);

  return points;
}

// ── Chart renderers ───────────────────────────────────────────────────────────

function TimeseriesChart({ id, points }: { id: string; points: DataPoint[] }) {
  const hasData = points.length > 0;
  const data = hasData ? points.map((p) => ({ t: p.t, v: p.v })) : PH_TIMESERIES;
  const tickInterval = Math.max(1, Math.floor(data.length / 5));

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={hasData ? 0.4 : 0.06} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" vertical={false} />
          <XAxis
            dataKey="t"
            hide={!hasData}
            interval={tickInterval}
            tickFormatter={(t: string) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={hasData
              ? [0, (dataMax: number) => Math.min(100, Math.max(dataMax * 1.5, 5))]
              : [0, 100]}
            tickCount={4}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(label) =>
              hasData && typeof label === "string"
                ? new Date(label).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : ""
            }
            formatter={(v) => [`${typeof v === "number" ? v.toFixed(1) : ""}%`, "value"]}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke="#3b82f6"
            strokeWidth={2}
            fill={`url(#grad-${id})`}
            connectNulls={false}
            dot={points.length === 1 ? { r: 3, fill: "#3b82f6" } : false}
            strokeOpacity={hasData ? 1 : 0.12}
          />
        </AreaChart>
      </ResponsiveContainer>
      {!hasData && NO_DATA_OVERLAY}
    </div>
  );
}

function BarChartWidget({ points }: { points: DataPoint[] }) {
  const hasData = points.length > 0;
  const data = hasData
    ? points.slice(-8).map((p, i) => ({ name: String(i + 1), v: p.v }))
    : PH_BAR;

  return (
    <div className="relative h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 100]} tickCount={3} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [typeof v === "number" ? `${v.toFixed(1)}%` : v, ""]} />
          <Bar dataKey="v" fill="hsl(var(--primary))" fillOpacity={hasData ? 0.7 : 0.2} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {!hasData && NO_DATA_OVERLAY}
    </div>
  );
}

function PieChartWidget({ points }: { points: DataPoint[] }) {
  const hasData = points.length > 0;
  const lastVal = hasData ? (points[points.length - 1]?.v ?? 0) : null;
  const colors = ["hsl(var(--primary))", "hsl(var(--muted-foreground))"];
  const pieData = lastVal !== null
    ? [{ name: "Used", value: lastVal }, { name: "Free", value: Math.max(0, 100 - lastVal) }]
    : PH_PIE;

  return (
    <div className="relative h-32">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [typeof v === "number" ? `${v.toFixed(1)}%` : v, ""]} />
          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={52} innerRadius={24} strokeWidth={0}>
            {pieData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length] ?? "hsl(var(--muted))"} fillOpacity={hasData ? (i === 0 ? 0.8 : 0.2) : 0.25} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {!hasData && NO_DATA_OVERLAY}
    </div>
  );
}

function ToplistChart({ points }: { points: DataPoint[] }) {
  const hasData = points.length > 0;
  const data = hasData
    ? points.slice(-5).map((p, i) => ({ name: `t-${i + 1}`, v: p.v }))
    : PH_TOPLIST;

  return (
    <div className="relative h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 56, bottom: 0 }}>
          <XAxis type="number" domain={[0, 100]} tickCount={3} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [typeof v === "number" ? `${v.toFixed(1)}%` : v, ""]} />
          <Bar dataKey="v" fill="hsl(var(--primary))" fillOpacity={hasData ? 0.7 : 0.2} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {!hasData && NO_DATA_OVERLAY}
    </div>
  );
}

function StatWidget({ points }: { points: DataPoint[] }) {
  const lastVal = points.length > 0 ? (points[points.length - 1]?.v ?? null) : null;
  return (
    <div className="flex items-center justify-center h-24 rounded-md bg-muted/40">
      <div className="text-center">
        {lastVal !== null ? (
          <p className="text-3xl font-bold">
            {lastVal.toFixed(1)}<span className="text-lg font-normal text-muted-foreground">%</span>
          </p>
        ) : (
          <>
            <p className="text-3xl font-bold text-muted-foreground/40">—</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting for live data</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function WidgetChart({ widget: w, dashboardId }: { widget: DbWidget; dashboardId: string }) {
  const points = useWidgetData(dashboardId, w.id);
  switch (w.type) {
    case "timeseries": return <TimeseriesChart id={w.id} points={points} />;
    case "bar":        return <BarChartWidget points={points} />;
    case "pie":        return <PieChartWidget points={points} />;
    case "toplist":    return <ToplistChart points={points} />;
    default:           return <StatWidget points={points} />;
  }
}
