"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { CreateEnvironmentModal } from "@/components/product/create-environment-modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DbMachine, Environment } from "@/lib/types";

interface EnvironmentWithStats extends Environment {
  machineCount: number;
  onlineCount: number;
  pendingCount: number;
}

export default function MachinesPage() {
  const [environments, setEnvironments] = useState<EnvironmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);

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
        setEnvironments(
          envs.map((env) => {
            const envMachines = machines.filter(
              (m) => m.environmentId === env.id
            );
            return {
              ...env,
              machineCount: envMachines.length,
              onlineCount: envMachines.filter((m) => m.status === "online")
                .length,
              pendingCount: envMachines.filter((m) => m.status === "pending")
                .length,
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
      ) : environments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Layers className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No environments yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an environment like Production or Development to organize
            your machines.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
