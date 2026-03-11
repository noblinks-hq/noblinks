"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Layers, Monitor, Server } from "lucide-react";
import { CreateEnvironmentModal } from "@/components/product/create-environment-modal";
import { PageHeader } from "@/components/product/page-header";
import { RemoveMachineModal } from "@/components/product/remove-machine-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DbMachine, Environment } from "@/lib/types";

interface EnvironmentWithStats extends Environment {
  machineCount: number;
  onlineCount: number;
  pendingCount: number;
  offlineCount: number;
}

function statusColor(status: string) {
  if (status === "online") return "bg-green-500";
  if (status === "pending") return "bg-amber-500";
  if (status === "offline") return "bg-red-500";
  return "bg-muted-foreground";
}

const MACHINE_PAGE_SIZE = 20;

export default function MachinesPage() {
  const [environments, setEnvironments] = useState<EnvironmentWithStats[]>([]);
  const [unassigned, setUnassigned] = useState<DbMachine[]>([]);
  const [unassignedHasMore, setUnassignedHasMore] = useState(false);
  const [loadingMoreUnassigned, setLoadingMoreUnassigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [removeMachine, setRemoveMachine] = useState<DbMachine | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [envsRes, machinesRes] = await Promise.all([
        fetch("/api/environments"),
        fetch(`/api/machines?limit=200`),
      ]);
      if (envsRes.ok && machinesRes.ok) {
        const envs = (await envsRes.json()) as Environment[];
        const { machines } = (await machinesRes.json()) as {
          machines: DbMachine[];
        };

        const unassignedAll = machines.filter((m) => !m.environmentId);
        setUnassigned(unassignedAll.slice(0, MACHINE_PAGE_SIZE));
        setUnassignedHasMore(unassignedAll.length > MACHINE_PAGE_SIZE);

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
              offlineCount: envMachines.filter((m) => m.status === "offline").length,
            };
          })
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadMoreUnassigned() {
    setLoadingMoreUnassigned(true);
    try {
      const res = await fetch(`/api/machines?limit=${MACHINE_PAGE_SIZE}&offset=${unassigned.length}`);
      if (res.ok) {
        const data = await res.json() as { machines: DbMachine[]; hasMore: boolean };
        const more = data.machines.filter((m) => !m.environmentId);
        setUnassigned((prev) => [...prev, ...more]);
        setUnassignedHasMore(data.hasMore);
      }
    } finally {
      setLoadingMoreUnassigned(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasAnything = environments.length > 0 || unassigned.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infrastructure"
        icon={Server}
        actions={<CreateEnvironmentModal onCreated={fetchData} />}
      />

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
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Install the Noblinks agent on a Linux machine to start monitoring.
            The install command is in your Settings.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/settings">
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Settings for install command
            </Link>
          </Button>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    {m.needsUpdate && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/50 shrink-0">
                        Update available
                      </Badge>
                    )}
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
              {unassignedHasMore && (
                <div className="flex justify-center pt-1">
                  <Button variant="outline" size="sm" onClick={loadMoreUnassigned} disabled={loadingMoreUnassigned}>
                    {loadingMoreUnassigned ? "Loading..." : "Show more"}
                  </Button>
                </div>
              )}
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
                        {env.offlineCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {env.offlineCount} offline
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
