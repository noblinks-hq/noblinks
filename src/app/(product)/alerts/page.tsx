"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { SeverityBadge } from "@/components/product/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { AlertSeverity, DbAlertStatus } from "@/lib/types";

interface DbAlertRow {
  id: string;
  name: string;
  machine: string;
  severity: string;
  status: string;
  createdAt: string;
}

const statusConfig: Record<
  DbAlertStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  configured: { label: "Configured", variant: "outline" },
  active: { label: "Active", variant: "default" },
  firing: { label: "Firing", variant: "destructive" },
  resolved: { label: "Resolved", variant: "secondary" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const PAGE_SIZE = 20;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DbAlertRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`/api/alerts?limit=${PAGE_SIZE}&offset=0`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
        setHasMore(data.hasMore ?? false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/alerts?limit=${PAGE_SIZE}&offset=${alerts.length}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => [...prev, ...data.alerts]);
        setHasMore(data.hasMore ?? false);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <Button asChild>
          <Link href="/alerts/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Alert
          </Link>
        </Button>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No alerts yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first alert using AI-powered natural language.
          </p>
          <Button asChild className="mt-4">
            <Link href="/alerts/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Alert
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Alert</th>
                  <th className="px-4 py-3 text-left font-medium">Severity</th>
                  <th className="px-4 py-3 text-left font-medium">Machine</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const cfg = statusConfig[alert.status as DbAlertStatus] ?? statusConfig.configured;
                  return (
                    <tr key={alert.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Link href={`/alerts/${alert.id}`} className="font-medium hover:underline">
                          {alert.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={alert.severity as AlertSeverity} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{alert.machine}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {alert.status === "firing" && (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                            </span>
                          )}
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground" suppressHydrationWarning>
                        {timeAgo(alert.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(alert.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {alerts.map((alert) => {
              const cfg = statusConfig[alert.status as DbAlertStatus] ?? statusConfig.configured;
              return (
                <div key={alert.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/alerts/${alert.id}`} className="font-medium hover:underline flex-1 min-w-0 truncate">
                      {alert.name}
                    </Link>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(alert.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <SeverityBadge severity={alert.severity as AlertSeverity} />
                    <div className="flex items-center gap-1.5">
                      {alert.status === "firing" && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                      )}
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <span>{alert.machine}</span>
                    <span suppressHydrationWarning>{timeAgo(alert.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Show more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
