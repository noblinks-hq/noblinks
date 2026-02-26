"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";
import {
  AlertAiChat,
  type AlertContext,
} from "@/components/product/alert-ai-chat";
import { SeverityBadge } from "@/components/product/severity-badge";
import { Badge } from "@/components/ui/badge";
import { useNoblinks } from "@/context/noblinks-context";

export default function AlertAiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { alerts, machines } = useNoblinks();

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

  const alertContext: AlertContext = {
    alertId: alert.id,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    status: alert.status,
    machineName,
    triggeredAt: alert.triggeredAt,
  };

  const header = (
    <div className="space-y-2">
      <Link
        href={`/alerts/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to alert
      </Link>
      <div className="flex items-center gap-3">
        <Bot className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">{alert.title}</h1>
        <SeverityBadge severity={alert.severity} />
        <Badge
          variant={alert.status === "triggered" ? "destructive" : "secondary"}
        >
          {alert.status === "triggered" ? "Triggered" : "Resolved"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Machine: {machineName} &middot; Triggered:{" "}
        {new Date(alert.triggeredAt).toLocaleString()}
      </p>
    </div>
  );

  return <AlertAiChat alertContext={alertContext} header={header} />;
}
