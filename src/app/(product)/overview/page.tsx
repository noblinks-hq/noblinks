"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Server,
  AlertTriangle,
  Activity,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { AlertRow } from "@/components/product/alert-row";
import { TimeSeriesWidget } from "@/components/product/time-series-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { useNoblinks } from "@/context/noblinks-context";
import { generateTimeSeriesData } from "@/lib/mock-data";
import type { Widget } from "@/lib/types";

const cpuChart: Widget = {
  id: "overview-cpu",
  machineId: "",
  type: "timeseries",
  title: "CPU Usage (24h)",
  metric: "cpu_usage_percent",
  data: generateTimeSeriesData(24, 15, 65),
};

const memoryChart: Widget = {
  id: "overview-memory",
  machineId: "",
  type: "timeseries",
  title: "Memory Usage (24h)",
  metric: "memory_usage_percent",
  data: generateTimeSeriesData(24, 40, 75),
};

const aiSuggestions = [
  {
    text: "Docker storage trending upward on prod-api-1",
    href: "/machines/machine-prod-api-1",
  },
  {
    text: "Pod restarts detected on k8s-cluster-1",
    href: "/machines/machine-k8s-cluster-1",
  },
  {
    text: "CPU usage on prod-api-1 exceeded 85% twice this week",
    href: "/machines/machine-prod-api-1",
  },
];

export default function OverviewPage() {
  const { machines, alerts, widgets } = useNoblinks();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const onlineMachines = machines.filter((m) => m.status === "online").length;
  const activeAlerts = alerts.filter((a) => a.status === "triggered").length;
  const recentAlerts = alerts.slice(0, 5);

  const stats = [
    {
      label: "Machines Online",
      value: onlineMachines,
      icon: Server,
      color: "text-green-500",
    },
    {
      label: "Active Alerts",
      value: activeAlerts,
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      label: "Total Monitors",
      value: widgets.length,
      icon: Activity,
      color: "text-blue-500",
    },
    {
      label: "AI Suggestions",
      value: 3,
      icon: Sparkles,
      color: "text-amber-500",
    },
  ];

  function getMachineName(machineId: string): string {
    return machines.find((m) => m.id === machineId)?.name ?? "Unknown";
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            {mounted ? (
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            ) : (
              <Skeleton className="mt-2 h-9 w-16" />
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeSeriesWidget widget={cpuChart} />
        <TimeSeriesWidget widget={memoryChart} />
      </div>

      {/* Recent Alerts + AI Suggestions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Alerts</h2>
            <Link
              href="/alerts"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Alert</th>
                    <th className="px-4 py-3 text-left font-medium">Severity</th>
                    <th className="px-4 py-3 text-left font-medium">Machine</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Triggered</th>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAlerts.map((alert) => (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      machineName={getMachineName(alert.machineId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Suggestions
          </h2>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, i) => (
              <Link
                key={i}
                href={suggestion.href}
                className="block rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
              >
                {suggestion.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
