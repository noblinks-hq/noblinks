"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNoblinks } from "@/context/noblinks-context";
import type { AiInsight } from "@/lib/types";

const severityDotColor: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
};

const aiInsights: AiInsight[] = [
  {
    id: "insight-1",
    message: "Disk usage trending toward 90% within 2 days",
    machineId: "machine-prod-api-1",
    machineName: "prod-api-1",
    confidence: "High confidence",
  },
  {
    id: "insight-2",
    message: "Memory growth anomaly detected",
    machineId: "machine-k8s-cluster-1",
    machineName: "k8s-cluster-1",
    confidence: "Medium confidence",
  },
  {
    id: "insight-3",
    message: "CPU saturation spikes increasing",
    machineId: "machine-prod-api-1",
    machineName: "prod-api-1",
  },
];

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
  const { machines } = useNoblinks();
  const [dbAlerts, setDbAlerts] = useState<DbAlertRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/alerts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setDbAlerts(data.alerts);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const firingAlerts = dbAlerts.filter((a) => a.status === "firing");
  const offlineMachines = machines.filter((m) => m.status === "offline");

  const allClear =
    firingAlerts.length === 0 &&
    offlineMachines.length === 0 &&
    aiInsights.length === 0;

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
                    {alert.machine} &middot; Created{" "}
                    {timeAgo(alert.createdAt)}
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
            {offlineMachines.map((machine) => (
              <div
                key={machine.id}
                className="flex items-center gap-4 rounded-lg border px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{machine.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Last seen {machine.lastSeen}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/machines/${machine.id}`}>View Machine</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">AI Insights</h2>
          <div className="mt-1 border-b" />
          <div className="mt-4 space-y-3">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-center gap-4 rounded-lg border px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{insight.message}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {insight.machineName}
                    {insight.confidence && (
                      <> &middot; {insight.confidence}</>
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/machines/${insight.machineId}`}>Review</Link>
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
          <h2 className="mt-6 text-2xl font-semibold">
            All systems operational
          </h2>
          <p className="mt-2 text-muted-foreground">
            No active alerts or risks detected.
          </p>
        </div>
      )}
    </div>
  );
}
