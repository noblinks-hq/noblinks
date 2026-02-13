"use client";

import { Server } from "lucide-react";
import { AddMachineModal } from "@/components/product/add-machine-modal";
import { MachineCard } from "@/components/product/machine-card";
import { useNoblinks } from "@/context/noblinks-context";

export default function MachinesPage() {
  const { machines } = useNoblinks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Machines</h1>
        <AddMachineModal />
      </div>

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
