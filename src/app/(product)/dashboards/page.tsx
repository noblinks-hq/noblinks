"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Monitor, Search } from "lucide-react";
import { CreateDashboardModal } from "@/components/product/create-dashboard-modal";
import { DashboardCard } from "@/components/product/dashboard-card";
import {
  SlideshowConfigModal,
  type SlideshowConfig,
} from "@/components/product/slideshow-config-modal";
import { SlideshowView } from "@/components/product/slideshow-view";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dashboard, DashboardCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: { label: string; value: DashboardCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "Docker", value: "docker" },
  { label: "Kubernetes", value: "kubernetes" },
  { label: "Custom", value: "custom" },
];

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    DashboardCategory | "all"
  >("all");
  const [slideshowConfig, setSlideshowConfig] =
    useState<SlideshowConfig | null>(null);

  const fetchDashboards = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboards");
      if (res.ok) {
        const data = await res.json();
        setDashboards(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  const filtered = useMemo(() => {
    let result = dashboards;
    if (categoryFilter !== "all") {
      result = result.filter((d) => d.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q));
    }
    return result;
  }, [dashboards, categoryFilter, search]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboards</h1>
          <div className="flex items-center gap-2">
            {!loading && dashboards.length > 0 && (
              <SlideshowConfigModal
                dashboards={dashboards}
                onStart={setSlideshowConfig}
              />
            )}
            <CreateDashboardModal onCreated={fetchDashboards} />
          </div>
        </div>

        {!loading && dashboards.length > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search dashboards…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    categoryFilter === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : dashboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Monitor className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No dashboards yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first dashboard to start monitoring.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No matching dashboards
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dashboard) => (
              <DashboardCard
                key={dashboard.id}
                dashboard={dashboard}
                onUpdated={fetchDashboards}
              />
            ))}
          </div>
        )}
      </div>

      {slideshowConfig && (
        <SlideshowView
          dashboards={dashboards}
          config={slideshowConfig}
          onExit={() => setSlideshowConfig(null)}
        />
      )}
    </>
  );
}
