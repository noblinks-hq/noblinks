"use client";

import Link from "next/link";
import { SeverityBadge } from "@/components/product/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNoblinks } from "@/context/noblinks-context";
import type { Alert } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AlertRow({
  alert,
  machineName,
}: {
  alert: Alert;
  machineName: string;
}) {
  const { updateAlertStatus } = useNoblinks();

  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="px-4 py-3">
        <Link
          href={`/alerts/${alert.id}`}
          className="font-medium hover:underline"
        >
          {alert.title}
        </Link>
      </td>
      <td className="px-4 py-3">
        <SeverityBadge severity={alert.severity} />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {machineName}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant={alert.status === "triggered" ? "destructive" : "secondary"}
        >
          {alert.status === "triggered" ? "Triggered" : "Resolved"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground" suppressHydrationWarning>
        {timeAgo(alert.triggeredAt)}
      </td>
      <td className="px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            updateAlertStatus(
              alert.id,
              alert.status === "triggered" ? "resolved" : "triggered"
            )
          }
        >
          {alert.status === "triggered" ? "Resolve" : "Reopen"}
        </Button>
      </td>
    </tr>
  );
}
