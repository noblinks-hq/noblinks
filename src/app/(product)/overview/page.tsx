"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DbMachine } from "@/lib/types";

const severityDotColor: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
};

interface DbAlertRow {
  id: string;
  name: string;
  machine: string;
  severity: string;
  status: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function OverviewPage() {
  const [dbAlerts, setDbAlerts] = useState<DbAlertRow[]>([]);
  const [machines, setMachines] = useState<DbMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/alerts").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/machines").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([alertData, machineData]) => {
        if (cancelled) return;
        if (alertData) setDbAlerts(alertData.alerts ?? []);
        if (machineData) setMachines(machineData.machines ?? []);
        setLastUpdated(new Date());
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const firingAlerts = dbAlerts.filter((a) => a.status === "firing");
  const offlineMachines = machines.filter((m) => m.status === "offline");
  const allClear = !loading && firingAlerts.length === 0 && offlineMachines.length === 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-10 py-4">
        <section>
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 py-4">
      {/* Active Alerts */}
      {firingAlerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Active Alerts</h2>
          <div className="mt-1 border-b" />
          <div className="mt-4 space-y-3">
            {firingAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-4 rounded-lg border px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${severityDotColor[alert.severity] ?? "bg-gray-400"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{alert.name}</p>
                  <p
                    className="mt-0.5 text-sm text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {alert.machine} &middot; Created {timeAgo(alert.createdAt)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/alerts/${alert.id}`}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Offline Machines */}
      {offlineMachines.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Offline Machines</h2>
          <div className="mt-1 border-b" />
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
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/machines/${m.id}`}>View Machine</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {allClear && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h2 className="mt-6 text-2xl font-semibold">All systems operational</h2>
          <p className="mt-2 text-muted-foreground">
            No active alerts or offline machines detected.
          </p>
          {lastUpdated && (
            <p className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>
              Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {lastUpdated && !allClear && (
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          Last updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
