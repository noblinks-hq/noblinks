"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Machine, MachineType } from "@/lib/types";

const typeLabels: Record<MachineType, string> = {
  linux: "Linux VM",
  windows: "Windows VM",
  kubernetes: "Kubernetes",
};

const typeGradients: Record<MachineType, string> = {
  linux: "from-emerald-500/20 to-emerald-500/5",
  windows: "from-blue-500/20 to-blue-500/5",
  kubernetes: "from-purple-500/20 to-purple-500/5",
};

export function MachineCard({ machine }: { machine: Machine }) {
  const gradient = typeGradients[machine.type];

  return (
    <Link
      href={`/machines/${machine.id}`}
      className="block rounded-lg border transition-colors hover:bg-muted/50"
    >
      <div className={`h-20 rounded-t-lg bg-gradient-to-br ${gradient}`} />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{machine.name}</h3>
            {machine.ip && (
              <p className="text-sm text-muted-foreground">{machine.ip}</p>
            )}
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

        <p className="text-xs text-muted-foreground">
          Last seen: {machine.lastSeen}
        </p>
      </div>
    </Link>
  );
}
