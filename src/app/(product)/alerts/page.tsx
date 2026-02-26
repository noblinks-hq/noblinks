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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DbAlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

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
        <div className="overflow-x-auto rounded-lg border">
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
                  <tr
                    key={alert.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/alerts/${alert.id}`}
                        className="font-medium hover:underline"
                      >
                        {alert.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge
                        severity={alert.severity as AlertSeverity}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {alert.machine}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {timeAgo(alert.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(alert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
