"use client";

import { use, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Terminal,
  CheckCircle,
  Clock,
  Sparkles,
  Bot,
} from "lucide-react";
import { SeverityBadge } from "@/components/product/severity-badge";
import { TerminalBlock } from "@/components/product/terminal-block";
import { TimeSeriesWidget } from "@/components/product/time-series-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNoblinks } from "@/context/noblinks-context";
import {
  generateTimeSeriesData,
  terminalCommandsByMetric,
  aiGuidanceByMetric,
} from "@/lib/mock-data";

export default function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { alerts, machines, widgets, updateAlertStatus } = useNoblinks();
  const terminalRef = useRef<HTMLDivElement>(null);

  const alert = alerts.find((a) => a.id === id);

  if (!alert) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Alert not found</h1>
        <p className="text-muted-foreground">
          This alert doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  const machine = machines.find((m) => m.id === alert.machineId);
  const machineName = machine?.name ?? "Unknown";

  // Find a matching widget for this alert's machine, or generate a fallback
  const matchingWidget = widgets.find(
    (w) => w.machineId === alert.machineId
  );
  const chartWidget = matchingWidget ?? {
    id: "alert-chart",
    machineId: alert.machineId,
    type: "timeseries" as const,
    title: "Metric",
    metric: "unknown",
    data: generateTimeSeriesData(24, 20, 90, true),
    thresholdValue: 80,
  };

  const severityColors: Record<string, string> = {
    critical: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
    warning:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    info: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  };

  const triggeredTime = new Date(alert.triggeredAt).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/alerts" className="hover:text-foreground">
          Alerts
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="line-clamp-1 text-foreground">{alert.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{alert.title}</h1>
          <SeverityBadge severity={alert.severity} />
          <Badge
            variant={
              alert.status === "triggered" ? "destructive" : "secondary"
            }
          >
            {alert.status === "triggered" ? "Triggered" : "Resolved"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Machine:{" "}
          <Link
            href={`/machines/${alert.machineId}`}
            className="text-primary hover:underline"
          >
            {machineName}
          </Link>
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() =>
            terminalRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Terminal className="mr-2 h-4 w-4" />
          Open Terminal
        </Button>
        {alert.status === "triggered" ? (
          <Button
            onClick={() => updateAlertStatus(alert.id, "resolved")}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Resolved
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => updateAlertStatus(alert.id, "triggered")}
          >
            Reopen
          </Button>
        )}
      </div>

      {/* Chart */}
      <TimeSeriesWidget widget={chartWidget} />

      {/* AI Explanation */}
      <div
        className={`rounded-lg border p-4 ${severityColors[alert.severity] ?? severityColors.info}`}
      >
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <Bot className="h-4 w-4" />
          AI Analysis
        </div>
        <p className="text-sm">{alert.description}</p>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <h3 className="font-semibold">Timeline</h3>
        <div className="space-y-4 border-l-2 pl-4">
          <div className="relative">
            <div className="absolute -left-[1.3rem] top-0.5 h-3 w-3 rounded-full border-2 border-red-500 bg-background" />
            <p className="text-sm font-medium">Triggered</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {triggeredTime}
            </p>
          </div>
          <div className="relative">
            <div className="absolute -left-[1.3rem] top-0.5 h-3 w-3 rounded-full border-2 border-blue-500 bg-background" />
            <p className="text-sm font-medium">AI analyzed the incident</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Identified root cause and suggested fix
            </p>
          </div>
          <div className="relative">
            <div className="absolute -left-[1.3rem] top-0.5 h-3 w-3 rounded-full border-2 border-green-500 bg-background" />
            <p className="text-sm font-medium">Suggested fix available</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Terminal className="h-3 w-3" />
              Open the terminal below to investigate
            </p>
          </div>
        </div>
      </div>

      {/* Terminal + AI Guidance */}
      <div ref={terminalRef} className="space-y-4">
        <h3 className="font-semibold">Terminal</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TerminalBlock
              entries={
                terminalCommandsByMetric[chartWidget.metric] ??
                terminalCommandsByMetric["cpu_usage_percent"] ??
                []
              }
            />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">
              AI Guidance
            </h4>
            {(
              aiGuidanceByMetric[chartWidget.metric] ??
              aiGuidanceByMetric["cpu_usage_percent"] ??
              []
            ).map((suggestion, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Suggestion {i + 1}
                </div>
                <p className="text-muted-foreground">{suggestion.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
