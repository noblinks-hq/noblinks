"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Monitor } from "lucide-react";
import { CreateEnvironmentModal } from "@/components/product/create-environment-modal";
import { RemoveMachineModal } from "@/components/product/remove-machine-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DbMachine, Environment } from "@/lib/types";

interface EnvironmentWithStats extends Environment {
  machineCount: number;
  onlineCount: number;
  pendingCount: number;
}

function statusColor(status: string) {
  if (status === "online") return "bg-green-500";
  if (status === "pending") return "bg-amber-500";
  return "bg-muted-foreground";
}

export default function MachinesPage() {
  const [environments, setEnvironments] = useState<EnvironmentWithStats[]>([]);
  const [unassigned, setUnassigned] = useState<DbMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeMachine, setRemoveMachine] = useState<DbMachine | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [envsRes, machinesRes] = await Promise.all([
        fetch("/api/environments"),
        fetch("/api/machines"),
      ]);
      if (envsRes.ok && machinesRes.ok) {
        const envs = (await envsRes.json()) as Environment[];
        const { machines } = (await machinesRes.json()) as {
          machines: DbMachine[];
        };

        setUnassigned(machines.filter((m) => !m.environmentId));

        setEnvironments(
          envs.map((env) => {
            const envMachines = machines.filter(
              (m) => m.environmentId === env.id
            );
            return {
              ...env,
              machineCount: envMachines.length,
              onlineCount: envMachines.filter((m) => m.status === "online").length,
              pendingCount: envMachines.filter((m) => m.status === "pending").length,
            };
          })
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasAnything = environments.length > 0 || unassigned.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Machines</h1>
        <CreateEnvironmentModal onCreated={fetchData} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : !hasAnything ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Layers className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No machines yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Install the agent on a Linux machine, or create an environment to
            organize your machines.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Unassigned machines — registered via agent but not yet in an environment */}
          {unassigned.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Unassigned
                </h2>
                <Badge variant="outline">{unassigned.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {unassigned.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border px-4 py-3"
                  >
                    <Monitor className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <Link href={`/machines/${m.id}`} className="min-w-0 flex-1 hover:underline">
                      <p className="truncate font-medium">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.hostname ?? m.ip ?? "No hostname"}
                      </p>
                    </Link>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusColor(m.status)}`} />
                      {m.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => setRemoveMachine(m)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environments */}
          {environments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Environments
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {environments.map((env) => (
                  <Link
                    key={env.id}
                    href={`/machines/${env.id}`}
                    className="block rounded-lg border transition-colors hover:bg-muted/50"
                  >
                    <div className="h-16 rounded-t-lg bg-gradient-to-br from-primary/20 to-primary/5" />
                    <div className="space-y-2 p-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{env.name}</h3>
                        <Badge variant="secondary">
                          {env.machineCount}{" "}
                          {env.machineCount === 1 ? "machine" : "machines"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {env.onlineCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {env.onlineCount} online
                          </span>
                        )}
                        {env.pendingCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {env.pendingCount} pending
                          </span>
                        )}
                        {env.machineCount === 0 && <span>No machines yet</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {removeMachine && (
        <RemoveMachineModal
          machine={removeMachine}
          open={!!removeMachine}
          onOpenChange={(v) => { if (!v) setRemoveMachine(null); }}
          onRemoved={() => { setRemoveMachine(null); fetchData(); }}
        />
      )}
    </div>
  );
}
