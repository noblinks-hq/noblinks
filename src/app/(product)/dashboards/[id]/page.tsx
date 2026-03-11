"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, AlignLeft, BarChart2, Check, ChevronDown, ChevronRight, ChevronUp, Gauge, LayoutGrid, Pencil, PieChart as PieIcon, Sparkles, Trash2, X } from "lucide-react";
import { AddWidgetModal } from "@/components/product/add-widget-modal";
import { WidgetChart } from "@/components/product/widget-chart";
import { WidgetChatPanel } from "@/components/product/widget-chat-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface MetricEntry {
  machineName: string;
  metricKey: string;
}

export default function DashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DbWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [widgetModalPrompt, setWidgetModalPrompt] = useState("");
  const [widgetModalMachine, setWidgetModalMachine] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, widgetsRes] = await Promise.all([
        fetch(`/api/dashboards/${id}`),
        fetch(`/api/dashboards/${id}/widgets`),
      ]);
      if (dashRes.ok) {
        setDashboard(await dashRes.json() as Dashboard);
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

  async function loadMetrics() {
    if (metrics.length > 0) { setBrowseOpen((v) => !v); return; }
    setBrowseOpen(true);
    setMetricsLoading(true);
    try {
      const res = await fetch("/api/metrics");
      if (res.ok) {
        const data = await res.json() as { metrics: MetricEntry[] };
        setMetrics(data.metrics);
      }
    } finally {
      setMetricsLoading(false);
    }
  }

  function openAddWidgetNormal() {
    setWidgetModalPrompt("");
    setWidgetModalMachine("");
    setWidgetModalOpen(true);
  }

  function openAddWidgetFromMetric(metricKey: string, machineName: string) {
    setWidgetModalPrompt(metricKey);
    setWidgetModalMachine(machineName);
    setWidgetModalOpen(true);
    setBrowseOpen(false);
  }

  const gradient =
    categoryColors[dashboard?.category ?? "custom"] ?? categoryColors.custom;

  return (
    <>
    <div className="space-y-6 pb-16">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMetrics}>
            {browseOpen ? <ChevronUp className="mr-1.5 h-3.5 w-3.5" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}
            Browse metrics
          </Button>
          <Button onClick={openAddWidgetNormal}>
            <Sparkles className="mr-2 h-4 w-4" />
            Add Widget
          </Button>
        </div>
        <AddWidgetModal
          dashboardId={id}
          onCreated={fetchData}
          externalOpen={widgetModalOpen}
          onExternalOpenChange={setWidgetModalOpen}
          prefillPrompt={widgetModalPrompt}
          prefillMachine={widgetModalMachine}
        />
      </div>

      {/* Browse Metrics Panel */}
      {browseOpen && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">
            Available metrics <span className="text-muted-foreground font-normal">(last 24 hours)</span>
          </p>
          {metricsLoading ? (
            <p className="text-sm text-muted-foreground">Loading metrics…</p>
          ) : metrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No metric data received yet. Make sure your agent is running.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                metrics.reduce<Record<string, string[]>>((acc, { machineName, metricKey }) => {
                  (acc[machineName] ??= []).push(metricKey);
                  return acc;
                }, {})
              ).map(([machineName, keys]) => (
                <div key={machineName}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{machineName}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => openAddWidgetFromMetric(key, machineName)}
                        className="rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-mono text-foreground hover:bg-muted hover:border-foreground/30 transition-colors"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              onUpdated={fetchData}
            />
          ))}
        </div>
      )}
    </div>
    <WidgetChatPanel dashboardId={id} onWidgetCreated={fetchData} />
    </>
  );
}

// ── Chart type metadata ──────────────────────────────────────────────────────

const CHART_TYPE_META: Record<WidgetType, { label: string; icon: React.ReactNode }> = {
  timeseries: { label: "Time Series", icon: <Activity className="mr-1 h-3 w-3" /> },
  stat:        { label: "Stat",        icon: <Gauge className="mr-1 h-3 w-3" /> },
  bar:         { label: "Bar Chart",   icon: <BarChart2 className="mr-1 h-3 w-3" /> },
  pie:         { label: "Pie Chart",   icon: <PieIcon className="mr-1 h-3 w-3" /> },
  toplist:     { label: "Top List",    icon: <AlignLeft className="mr-1 h-3 w-3" /> },
};

// ── WidgetCard ────────────────────────────────────────────────────────────────

function WidgetCard({
  widget: w,
  dashboardId,
  gradient,
  onDeleted,
  onUpdated,
}: {
  widget: DbWidget;
  dashboardId: string;
  gradient: string;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [deleting, setDeleting] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(w.title);
  const [editType, setEditType] = React.useState<WidgetType>(w.type as WidgetType);
  const [saving, setSaving] = React.useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const meta = CHART_TYPE_META[w.type as WidgetType] ?? CHART_TYPE_META.stat;

  function startEdit() {
    setEditTitle(w.title);
    setEditType(w.type as WidgetType);
    setEditing(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const r = await fetch(`/api/dashboards/${dashboardId}/widgets/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, type: editType }),
      });
      if (r.ok) {
        setEditing(false);
        onUpdated();
      }
    } finally {
      setSaving(false);
    }
  }

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
          {editing ? (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <Input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-7 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
              />
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as WidgetType)}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs"
              >
                {Object.entries(CHART_TYPE_META).map(([t, m]) => (
                  <option key={t} value={t}>{(m as { label: string }).label}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" disabled={saving} onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={cancelEdit}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="min-w-0">
                <h3 className="font-medium leading-tight truncate">
                  {w.title.includes(" — ") ? w.title.split(" — ")[0] : w.title}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {meta.icon}{meta.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={startEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
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
            </>
          )}
        </div>
        <WidgetChart widget={w} dashboardId={dashboardId} />
        <p className="text-xs text-muted-foreground truncate">
          {w.title.includes(" — ") ? w.title.split(" — ").slice(1).join(" — ") : w.machine}
        </p>
      </div>
    </div>
  );
}
