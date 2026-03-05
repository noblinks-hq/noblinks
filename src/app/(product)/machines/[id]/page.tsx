"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Server } from "lucide-react";
import { AddMachineToEnvModal } from "@/components/product/add-machine-to-env-modal";
import { ConnectMachineModal } from "@/components/product/connect-machine-modal";
import { RemoveMachineModal } from "@/components/product/remove-machine-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DbMachine, Environment } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  linux: "Linux",
  kubernetes: "Kubernetes",
  windows: "Windows",
};

const TYPE_COLORS: Record<string, string> = {
  linux: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  kubernetes: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  windows: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

export default function EnvironmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: envId } = use(params);
  const [env, setEnv] = useState<Environment | null>(null);
  const [machines, setMachines] = useState<DbMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [connectMachine, setConnectMachine] = useState<DbMachine | null>(null);
  const [removeMachine, setRemoveMachine] = useState<DbMachine | null>(null);

  const fetchMachines = useCallback(async () => {
    const res = await fetch(`/api/machines?environmentId=${envId}`);
    if (res.ok) {
      const data = (await res.json()) as { machines: DbMachine[] };
      setMachines(data.machines);
    }
  }, [envId]);

  useEffect(() => {
    async function load() {
      try {
        const [envsRes] = await Promise.all([
          fetch("/api/environments"),
          fetchMachines(),
        ]);
        if (envsRes.ok) {
          const envs = (await envsRes.json()) as Environment[];
          setEnv(envs.find((e) => e.id === envId) ?? null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [envId, fetchMachines]);

  function handleAdded(machine: DbMachine) {
    setAddOpen(false);
    setMachines((prev) => [...prev, machine]);
    setConnectMachine(machine);
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/machines" className="hover:text-foreground">
          Machines
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">
          {loading ? "..." : (env?.name ?? "Environment")}
        </span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {loading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            (env?.name ?? "Environment")
          )}
        </h1>
        <Button onClick={() => setAddOpen(true)}>Add Machine</Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : machines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Server className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No machines yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first machine to get started.
          </p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}>
            Add Machine
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Machine</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">IP Address</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr
                  key={m.id}
                  className="border-b last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{m.name}</span>
                      {m.hostname && m.hostname !== m.name && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({m.hostname})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.category ? (
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-medium",
                          TYPE_COLORS[m.category] ??
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {TYPE_LABELS[m.category] ?? m.category}
                      </span>
                    ) : (
                      "\u2014"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.ip ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    {m.status === "online" ? (
                      <Badge className="bg-green-600 hover:bg-green-600">
                        Online
                      </Badge>
                    ) : m.status === "pending" ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                      >
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Offline</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {m.status !== "online" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConnectMachine(m)}
                        >
                          Connect
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRemoveMachine(m)}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddMachineToEnvModal
        environmentId={envId}
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={handleAdded}
      />

      {connectMachine && (
        <ConnectMachineModal
          machine={connectMachine}
          open={!!connectMachine}
          onOpenChange={(v) => { if (!v) setConnectMachine(null); }}
          onConnected={() => { setConnectMachine(null); fetchMachines(); }}
        />
      )}

      {removeMachine && (
        <RemoveMachineModal
          machine={removeMachine}
          open={!!removeMachine}
          onOpenChange={(v) => { if (!v) setRemoveMachine(null); }}
          onRemoved={() => { setRemoveMachine(null); fetchMachines(); }}
        />
      )}
    </div>
  );
}
