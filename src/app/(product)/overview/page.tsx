"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/product/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FiringAlert {
  id: string;
  name: string;
  machine: string;
  severity: string;
  status: string;
  firedAt: string | null;
  createdAt: string;
}

interface OfflineMachine {
  id: string;
  name: string;
  hostname: string | null;
  lastSeen: string | null;
  status: string;
}

interface Suggestion {
  machineName: string;
  metricKey: string;
  message: string;
  severity: string;
}

interface OverviewData {
  firingAlerts: FiringAlert[];
  offlineMachines: OfflineMachine[];
  suggestions: Suggestion[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const SEVERITY_ICON_COLOR: Record<string, string> = {
  critical: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Dummy data for preview
// ---------------------------------------------------------------------------

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

const DUMMY_DATA: OverviewData = {
  firingAlerts: [
    { id: "1", name: "High CPU Usage", machine: "prod-web-01", severity: "critical", status: "firing", firedAt: ago(14), createdAt: ago(120) },
    { id: "2", name: "Memory Usage Threshold", machine: "prod-db-02", severity: "warning", status: "firing", firedAt: ago(47), createdAt: ago(240) },
    { id: "3", name: "Disk Space Low", machine: "prod-worker-03", severity: "warning", status: "firing", firedAt: ago(91), createdAt: ago(360) },
  ],
  offlineMachines: [
    { id: "m1", name: "staging-worker-02", hostname: "stg-wkr-02.internal", lastSeen: ago(43), status: "offline" },
    { id: "m2", name: "prod-monitor-01", hostname: "mon-01.internal", lastSeen: ago(182), status: "offline" },
  ],
  suggestions: [
    { machineName: "prod-db-02", metricKey: "memory_used_percent", message: "Memory usage on **prod-db-02** has increased 38% in the last 2 hours (now at 87.4%). You may need to add more RAM or investigate memory leaks.", severity: "critical" },
    { machineName: "prod-web-01", metricKey: "cpu_usage_percent", message: "CPU usage on **prod-web-01** has risen 52% recently (now at 91.2%). Consider investigating runaway processes or scaling up.", severity: "critical" },
    { machineName: "prod-worker-03", metricKey: "disk_used_percent", message: "Disk usage on **prod-worker-03** is climbing fast — up 22% recently (now at 78.6%). Consider cleaning up logs or expanding storage.", severity: "warning" },
    { machineName: "prod-db-01", metricKey: "load_5", message: "System load on **prod-db-01** has increased 31% (current: 4.82). The machine may be under stress.", severity: "warning" },
  ],
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData>(DUMMY_DATA);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/overview");
      if (res.ok) {
        const json = (await res.json()) as OverviewData;
        const hasRealData =
          json.firingAlerts.length > 0 ||
          json.offlineMachines.length > 0 ||
          json.suggestions.length > 0;
        if (hasRealData) setData(json);
      }
    } catch {
      // Silently fail — keep showing current data
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const { firingAlerts, offlineMachines, suggestions } = data;
  const allClear =
    firingAlerts.length === 0 &&
    offlineMachines.length === 0 &&
    suggestions.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-4">
      <PageHeader
        title="Overview"
        icon={LayoutDashboard}
        actions={
          <Button variant="ghost" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {allClear ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h2 className="mt-6 text-2xl font-semibold">All systems operational</h2>
          <p className="mt-2 text-muted-foreground">
            No active alerts, offline machines, or anomalies detected.
          </p>
        </div>
      ) : (
        <>
          {firingAlerts.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Firing Alerts</h2>
              <div className="mt-4 space-y-3">
                {firingAlerts.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-4 rounded-lg border border-l-4 px-5 py-4 transition-colors hover:bg-muted/50 ${SEVERITY_BORDER[a.severity] ?? "border-l-gray-400"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{a.machine}</p>
                    </div>
                    <Badge variant="secondary" className={`shrink-0 ${SEVERITY_BADGE[a.severity] ?? ""}`}>
                      {a.severity}
                    </Badge>
                    <span className="shrink-0 text-sm text-muted-foreground" suppressHydrationWarning>
                      {timeAgo(a.firedAt)}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/alerts/${a.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {offlineMachines.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Disconnected Machines</h2>
              <div className="mt-4 space-y-3">
                {offlineMachines.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 rounded-lg border px-5 py-4 transition-colors hover:bg-muted/50"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{m.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground" suppressHydrationWarning>
                        {m.lastSeen ? `Last seen ${timeAgo(m.lastSeen)}` : "Never connected"}
                        {m.hostname && ` \u00B7 ${m.hostname}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/machines/${m.id}`}>View Machine</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <h2 className="text-base font-semibold">AI Insights</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on metric trends from the last 24 hours
              </p>
              <div className="mt-4 space-y-3">
                {suggestions.map((s, idx) => (
                  <div
                    key={`${s.machineName}-${s.metricKey}-${idx}`}
                    className={`rounded-lg border border-l-4 px-5 py-4 ${SEVERITY_BORDER[s.severity] ?? "border-l-gray-400"}`}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className={`mt-0.5 h-4 w-4 shrink-0 ${SEVERITY_ICON_COLOR[s.severity] ?? "text-muted-foreground"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-relaxed">{s.message}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs">{s.machineName}</Badge>
                        <Badge variant="secondary" className={`text-xs ${SEVERITY_BADGE[s.severity] ?? ""}`}>
                          {s.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
