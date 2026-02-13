"use client";

import Link from "next/link";
import { Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Machine } from "@/lib/types";

const typeLabels: Record<string, string> = {
  linux: "Linux VM",
  windows: "Windows VM",
  kubernetes: "Kubernetes",
};

export function MachineCard({ machine }: { machine: Machine }) {
  return (
    <Link
      href={`/machines/${machine.id}`}
      className="block rounded-lg border p-6 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{machine.name}</h3>
            <p className="text-sm text-muted-foreground">
              Last seen: {machine.lastSeen}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={machine.status === "online" ? "default" : "secondary"}
            className={
              machine.status === "online"
                ? "bg-green-600 hover:bg-green-600"
                : ""
            }
          >
            {machine.status === "online" ? "Online" : "Offline"}
          </Badge>
          <Badge variant="outline">{typeLabels[machine.type]}</Badge>
        </div>
      </div>
    </Link>
  );
}
