"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronRight, Activity } from "lucide-react";
import { AiChatPanel } from "@/components/product/ai-chat-panel";
import { EmptyState } from "@/components/product/empty-state";
import { TimeSeriesWidget } from "@/components/product/time-series-widget";
import { Badge } from "@/components/ui/badge";
import { useNoblinks } from "@/context/noblinks-context";

const typeLabels: Record<string, string> = {
  linux: "Linux VM",
  windows: "Windows VM",
  kubernetes: "Kubernetes",
};

export default function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/machines" className="hover:text-foreground">
          Machines
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{machine.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{machine.name}</h1>
        <Badge
          variant="default"
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

      {/* Two-column layout: widgets + chat panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Widget area (2/3) */}
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

        {/* AI Chat panel (1/3) */}
        <AiChatPanel machineId={machine.id} machineName={machine.name} />
      </div>
    </div>
  );
}
