"use client";

import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { AddMachineModal } from "@/components/product/add-machine-modal";
import { MachineCard } from "@/components/product/machine-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNoblinks } from "@/context/noblinks-context";
import type { DbMachine } from "@/lib/types";

export default function MachinesPage() {
  const { machines } = useNoblinks();
  const [discoveredMachines, setDiscoveredMachines] = useState<DbMachine[]>([]);

  useEffect(() => {
    function fetchDiscovered() {
      fetch("/api/machines?unassigned=true")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { machines: DbMachine[] } | null) => {
          if (data) setDiscoveredMachines(data.machines);
        })
        .catch(() => {});
    }
    fetchDiscovered();
    const interval = setInterval(fetchDiscovered, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleAssign(machineId: string, category: string) {
    const res = await fetch(`/api/machines/${machineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    if (res.ok) {
      setDiscoveredMachines((prev) => prev.filter((m) => m.id !== machineId));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Machines</h1>
        <AddMachineModal />
      </div>

      {discoveredMachines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Discovered Machines</h2>
            <Badge variant="secondary">{discoveredMachines.length}</Badge>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Machine</th>
                  <th className="px-4 py-3 text-left font-medium">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Discovered
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discoveredMachines.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="font-medium">{m.name}</span>
                        {m.hostname && m.hostname !== m.name && (
                          <span className="text-xs text-muted-foreground">
                            ({m.hostname})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.ip ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.lastSeen
                        ? new Date(m.lastSeen).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Assign &#9662;
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleAssign(m.id, "linux")}
                          >
                            Linux VM
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAssign(m.id, "windows")}
                          >
                            Windows VM
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAssign(m.id, "kubernetes")}
                          >
                            Kubernetes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {machines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Server className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No machines connected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first machine to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      )}
    </div>
  );
}
