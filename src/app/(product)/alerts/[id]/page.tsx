"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Bot,
  Code,
  Server,
  Gauge,
  Clock,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { SeverityBadge } from "@/components/product/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { AlertSeverity, DbAlertStatus } from "@/lib/types";

interface AlertDetail {
  id: string;
  name: string;
  description: string | null;
  machine: string;
  severity: string;
  status: string;
  threshold: number;
  window: string;
  promqlQuery: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CapabilityDetail {
  id: string;
  name: string;
  capabilityKey: string;
  category: string;
}

const statusConfig: Record<
  DbAlertStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  configured: { label: "Configured (Not Deployed)", variant: "outline" },
  active: { label: "Active", variant: "default" },
  firing: { label: "Firing", variant: "destructive" },
  resolved: { label: "Resolved", variant: "secondary" },
};

export default function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [capability, setCapability] = useState<CapabilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchAlert = useCallback(async () => {
    try {
      const res = await fetch(`/api/alerts/${id}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setAlert(data.alert);
      setCapability(data.capability);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setAlert(data.alert);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/alerts");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !alert) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Alert not found</h1>
        <p className="text-muted-foreground">
          This alert doesn&apos;t exist or has been removed.
        </p>
        <Button variant="outline" asChild>
          <Link href="/alerts">Back to Alerts</Link>
        </Button>
      </div>
    );
  }

  const cfg = statusConfig[alert.status as DbAlertStatus] ?? statusConfig.configured;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/alerts" className="hover:text-foreground">
          Alerts
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="line-clamp-1 text-foreground">{alert.name}</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{alert.name}</h1>
          <SeverityBadge severity={alert.severity as AlertSeverity} />
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
        {alert.description && (
          <p className="text-sm text-muted-foreground">{alert.description}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={`/alerts/${id}/ai`}>
            <Bot className="mr-2 h-4 w-4" />
            Open Noblinks AI
          </Link>
        </Button>
        {alert.status === "configured" && (
          <Button onClick={() => handleStatusChange("active")}>
            Activate
          </Button>
        )}
        {alert.status === "firing" && (
          <Button onClick={() => handleStatusChange("resolved")}>
            Mark Resolved
          </Button>
        )}
        {alert.status === "resolved" && (
          <Button
            variant="outline"
            onClick={() => handleStatusChange("configured")}
          >
            Reconfigure
          </Button>
        )}
        <Button variant="ghost" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Details Grid */}
      <div className="rounded-lg border p-5">
        <h3 className="mb-4 font-semibold">Alert Configuration</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capability && (
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Capability
                </p>
                <p className="text-sm">{capability.name}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Server className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Machine
              </p>
              <p className="text-sm">{alert.machine}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Gauge className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Threshold
              </p>
              <p className="text-sm">{alert.threshold}%</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Window
              </p>
              <p className="text-sm">{alert.window}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PromQL Query */}
      <div className="rounded-lg border p-5">
        <div className="mb-3 flex items-center gap-2">
          <Code className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">PromQL Query</h3>
        </div>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
          <code>{alert.promqlQuery}</code>
        </pre>
      </div>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground" suppressHydrationWarning>
        Created {new Date(alert.createdAt).toLocaleString()} &middot; Last
        updated {new Date(alert.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
