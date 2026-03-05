"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlignLeft, BarChart2, ChevronRight, Gauge, LayoutGrid, PieChart as PieIcon, Trash2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AddWidgetModal } from "@/components/product/add-widget-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dashboard, DbWidget, WidgetType } from "@/lib/types";

const categoryColors: Record<string, string> = {
  infrastructure: "from-blue-500/20 to-blue-500/5",
  docker: "from-cyan-500/20 to-cyan-500/5",
  kubernetes: "from-purple-500/20 to-purple-500/5",
  custom: "from-amber-500/20 to-amber-500/5",
};

const categoryLabels: Record<string, string> = {
  infrastructure: "Infrastructure",
  docker: "Docker",
  kubernetes: "Kubernetes",
  custom: "Custom",
};

export default function DashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DbWidget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, widgetsRes] = await Promise.all([
        fetch("/api/dashboards"),
        fetch(`/api/dashboards/${id}/widgets`),
      ]);
      if (dashRes.ok) {
        const dashes = (await dashRes.json()) as Dashboard[];
        setDashboard(dashes.find((d) => d.id === id) ?? null);
      }
      if (widgetsRes.ok) {
        const data = (await widgetsRes.json()) as { widgets: DbWidget[] };
        setWidgets(data.widgets);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const gradient =
    categoryColors[dashboard?.category ?? "custom"] ?? categoryColors.custom;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboards" className="hover:text-foreground">
          Dashboards
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">
          {loading ? "..." : (dashboard?.name ?? "Dashboard")}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {loading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <>
              <h1 className="text-2xl font-bold">{dashboard?.name}</h1>
              {dashboard && (
                <>
                  <Badge variant="outline">
                    {categoryLabels[dashboard.category] ?? dashboard.category}
                  </Badge>
                  <Badge variant="secondary">{dashboard.environment}</Badge>
                </>
              )}
            </>
          )}
        </div>
        <AddWidgetModal dashboardId={id} onCreated={fetchData} />
      </div>

      {/* Widgets */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <LayoutGrid className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No widgets yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first widget to start visualizing your infrastructure
            metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {widgets.map((w) => (
            <WidgetCard
              key={w.id}
              widget={w}
              dashboardId={id}
              gradient={gradient ?? "from-amber-500/20 to-amber-500/5"}
              onDeleted={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chart type metadata ──────────────────────────────────────────────────────

const CHART_TYPE_META: Record<
  WidgetType,
  { label: string; icon: React.ReactNode }
> = {
  timeseries: { label: "Time Series", icon: <Activity className="mr-1 h-3 w-3" /> },
  stat:        { label: "Stat",        icon: <Gauge className="mr-1 h-3 w-3" /> },
  bar:         { label: "Bar Chart",   icon: <BarChart2 className="mr-1 h-3 w-3" /> },
  pie:         { label: "Pie Chart",   icon: <PieIcon className="mr-1 h-3 w-3" /> },
  toplist:     { label: "Top List",    icon: <AlignLeft className="mr-1 h-3 w-3" /> },
};

// ── Per-type placeholder data ─────────────────────────────────────────────────

const PH_TIMESERIES = Array.from({ length: 20 }, (_, i) => ({ t: i, v: null as number | null }));

const PH_BAR = [
  { name: "a", v: 72 },
  { name: "b", v: 45 },
  { name: "c", v: 88 },
  { name: "d", v: 33 },
  { name: "e", v: 61 },
];

const PH_PIE = [
  { name: "A", value: 45 },
  { name: "B", value: 30 },
  { name: "C", value: 15 },
  { name: "D", value: 10 },
];

const PH_TOPLIST = [
  { name: "process-1", v: 88 },
  { name: "process-2", v: 61 },
  { name: "process-3", v: 45 },
  { name: "process-4", v: 33 },
  { name: "process-5", v: 12 },
];

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

// ── Chart renderers ───────────────────────────────────────────────────────────

// ── Data fetching hook ────────────────────────────────────────────────────────

interface DataPoint { t: string; v: number }

function useWidgetData(dashboardId: string, widgetId: string) {
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
  const data = hasData
    ? points.map((p) => ({ t: p.t, v: p.v }))
    : PH_TIMESERIES;

  return (
    <div className="relative h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={hasData ? 0.3 : 0.1} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="t" hide />
          <YAxis domain={[0, 100]} tickCount={3} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(label) =>
              hasData && typeof label === "string" ? new Date(label).toLocaleTimeString() : ""
            }
            formatter={(v) => [`${typeof v === "number" ? v.toFixed(1) : ""}%`, ""]}
          />
          <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} fill={`url(#grad-${id})`} connectNulls={false} dot={false} strokeOpacity={hasData ? 1 : 0.2} />
        </AreaChart>
      </ResponsiveContainer>
      {!hasData && NO_DATA_OVERLAY}
    </div>
  );
}

function BarChartWidget({ points }: { points: DataPoint[] }) {
  const hasData = points.length > 0;
  // For bar: use the last value as a single bar, or latest N buckets
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
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--muted-foreground))",
  ];
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
          <>
            <p className="text-3xl font-bold">{lastVal.toFixed(1)}<span className="text-lg font-normal text-muted-foreground">%</span></p>
          </>
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

function WidgetChart({ widget: w, dashboardId }: { widget: DbWidget; dashboardId: string }) {
  const points = useWidgetData(dashboardId, w.id);
  switch (w.type) {
    case "timeseries": return <TimeseriesChart id={w.id} points={points} />;
    case "bar":        return <BarChartWidget points={points} />;
    case "pie":        return <PieChartWidget points={points} />;
    case "toplist":    return <ToplistChart points={points} />;
    default:           return <StatWidget points={points} />;
  }
}

// ── WidgetCard ────────────────────────────────────────────────────────────────

function WidgetCard({
  widget: w,
  dashboardId,
  gradient,
  onDeleted,
}: {
  widget: DbWidget;
  dashboardId: string;
  gradient: string;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = React.useState(false);
  const meta = CHART_TYPE_META[w.type as WidgetType] ?? CHART_TYPE_META.stat;

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/dashboards/${dashboardId}/widgets/${w.id}`, { method: "DELETE" });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium leading-tight truncate">{w.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{w.machine}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="secondary" className="text-xs">
              {meta.icon}{meta.label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <WidgetChart widget={w} dashboardId={dashboardId} />
        <code className="block truncate rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          {w.metric}
        </code>
      </div>
    </div>
  );
}
