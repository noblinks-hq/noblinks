"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronRight, Activity, Server } from "lucide-react";
import { AddMachineModal } from "@/components/product/add-machine-modal";
import { AiChatPanel } from "@/components/product/ai-chat-panel";
import { EmptyState } from "@/components/product/empty-state";
import { TimeSeriesWidget } from "@/components/product/time-series-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNoblinks } from "@/context/noblinks-context";
import type { MachineType } from "@/lib/types";

const CATEGORIES: Record<MachineType, string> = {
  linux: "Linux VM",
  windows: "Windows VM",
  kubernetes: "Kubernetes",
};

const CATEGORY_GRADIENTS: Record<MachineType, string> = {
  linux: "from-emerald-500/20 to-emerald-500/5",
  windows: "from-blue-500/20 to-blue-500/5",
  kubernetes: "from-purple-500/20 to-purple-500/5",
};

function isCategoryParam(id: string): id is MachineType {
  return id === "linux" || id === "windows" || id === "kubernetes";
}

// ── Category table view ──────────────────────────────────────────────────────

function CategoryPage({ type }: { type: MachineType }) {
  const { machines } = useNoblinks();
  const label = CATEGORIES[type];
  const gradient = CATEGORY_GRADIENTS[type];
  const catMachines = machines.filter((m) => m.type === type);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/machines" className="hover:text-foreground">
          Machines
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{label}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{label}</h1>
          <Badge variant="secondary">{catMachines.length}</Badge>
        </div>
        <AddMachineModal />
      </div>

      {catMachines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Server className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No {label} machines</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first machine to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Machine</th>
                <th className="px-4 py-3 text-left font-medium">IP Address</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Last Seen</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {catMachines.map((machine) => (
                <tr
                  key={machine.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-1 rounded-full bg-gradient-to-b ${gradient}`}
                      />
                      <span className="font-medium">{machine.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {machine.ip ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        machine.status === "online" ? "default" : "secondary"
                      }
                      className={
                        machine.status === "online"
                          ? "bg-green-600 hover:bg-green-600"
                          : ""
                      }
                    >
                      {machine.status === "online" ? "Online" : "Offline"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {machine.lastSeen}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/machines/${machine.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Machine detail view ──────────────────────────────────────────────────────

function MachineDetailPage({ id }: { id: string }) {
  const { machines, widgets } = useNoblinks();
  const machine = machines.find((m) => m.id === id);

  if (!machine) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Machine not found</h1>
        <p className="text-muted-foreground">
          This machine doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  const machineWidgets = widgets.filter((w) => w.machineId === machine.id);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/machines" className="hover:text-foreground">
          Machines
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/machines/${machine.type}`}
          className="hover:text-foreground"
        >
          {CATEGORIES[machine.type]}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{machine.name}</span>
      </nav>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{machine.name}</h1>
        <Badge
          variant="default"
          className={
            machine.status === "online" ? "bg-green-600 hover:bg-green-600" : ""
          }
        >
          {machine.status === "online" ? "Online" : "Offline"}
        </Badge>
        <Badge variant="outline">{CATEGORIES[machine.type]}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {machineWidgets.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No monitors yet"
              description="This machine is not being monitored yet. Tell Noblinks what you care about."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {machineWidgets.map((widget) => (
                <TimeSeriesWidget key={widget.id} widget={widget} />
              ))}
            </div>
          )}
        </div>
        <AiChatPanel machineId={machine.id} machineName={machine.name} />
      </div>
    </div>
  );
}

// ── Route entry point ────────────────────────────────────────────────────────

export default function MachinesRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  if (isCategoryParam(id)) {
    return <CategoryPage type={id} />;
  }

  return <MachineDetailPage id={id} />;
}
