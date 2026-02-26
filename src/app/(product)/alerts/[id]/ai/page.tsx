"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";
import {
  AlertAiChat,
  type AlertContext,
} from "@/components/product/alert-ai-chat";
import { SeverityBadge } from "@/components/product/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { AlertSeverity, DbAlertStatus } from "@/lib/types";

interface AlertDetail {
  id: string;
  name: string;
  description: string | null;
  machine: string;
  severity: string;
  status: string;
  createdAt: string;
}

const statusLabels: Record<DbAlertStatus, string> = {
  configured: "Configured",
  active: "Active",
  firing: "Firing",
  resolved: "Resolved",
};

export default function AlertAiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlert = useCallback(async () => {
    try {
      const res = await fetch(`/api/alerts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAlert(data.alert);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

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

  const alertContext: AlertContext = {
    alertId: alert.id,
    title: alert.name,
    description: alert.description || "No description available",
    severity: alert.severity,
    status: alert.status,
    machineName: alert.machine,
    triggeredAt: alert.createdAt,
  };

  const statusLabel = statusLabels[alert.status as DbAlertStatus] ?? alert.status;

  const header = (
    <div className="space-y-2">
      <Link
        href={`/alerts/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to alert
      </Link>
      <div className="flex items-center gap-3">
        <Bot className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">{alert.name}</h1>
        <SeverityBadge severity={alert.severity as AlertSeverity} />
        <Badge
          variant={alert.status === "firing" ? "destructive" : "secondary"}
        >
          {statusLabel}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Machine: {alert.machine} &middot; Created:{" "}
        {new Date(alert.createdAt).toLocaleString()}
      </p>
    </div>
  );

  return <AlertAiChat alertContext={alertContext} header={header} />;
}
