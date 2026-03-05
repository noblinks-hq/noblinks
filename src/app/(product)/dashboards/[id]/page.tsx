"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ChevronRight, Gauge, LayoutGrid } from "lucide-react";
import { AddWidgetModal } from "@/components/product/add-widget-modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dashboard, DbWidget } from "@/lib/types";

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => (
            <div key={w.id} className="rounded-lg border">
              <div
                className={`h-2 rounded-t-lg bg-gradient-to-r ${gradient}`}
              />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium leading-tight">{w.title}</h3>
                  <Badge
                    variant="secondary"
                    className="ml-2 shrink-0 text-xs"
                  >
                    {w.type === "timeseries" ? (
                      <>
                        <Activity className="mr-1 h-3 w-3" />
                        Time Series
                      </>
                    ) : (
                      <>
                        <Gauge className="mr-1 h-3 w-3" />
                        Stat
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Machine:{" "}
                  <span className="font-medium text-foreground">
                    {w.machine}
                  </span>
                </p>
                <code className="block truncate rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {w.metric}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
