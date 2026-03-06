"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, ExternalLink } from "lucide-react";
import { WidgetChart } from "@/components/product/widget-chart";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dashboard, DbWidget } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://noblinks.com";

const categoryLabels: Record<string, string> = {
  infrastructure: "Infrastructure",
  docker: "Docker",
  kubernetes: "Kubernetes",
  custom: "Custom",
};

export default function SharedDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DbWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { dashboard: Dashboard; widgets: DbWidget[] } | null) => {
        if (!data) { setNotFound(true); return; }
        setDashboard(data.dashboard);
        setWidgets(data.widgets);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (notFound || !dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-bold">Dashboard not found</h1>
          <p className="text-sm text-muted-foreground">
            This shared dashboard link is invalid or has been revoked.
          </p>
          <Link href={APP_URL} className="text-sm text-primary hover:underline">
            Go to Noblinks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BarChart2 className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">{dashboard.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[dashboard.category] ?? dashboard.category}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">{dashboard.environment}</span>
              </div>
            </div>
          </div>
          <Link
            href={APP_URL}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            Powered by Noblinks
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Widget grid */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {widgets.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
            This dashboard has no widgets yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {widgets.map((w) => (
              <WidgetChart key={w.id} widget={w} dashboardId={dashboard.id} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
