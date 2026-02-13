"use client";

import { AlertTriangle } from "lucide-react";
import { AlertRow } from "@/components/product/alert-row";
import { EmptyState } from "@/components/product/empty-state";
import { useNoblinks } from "@/context/noblinks-context";

export default function AlertsPage() {
  const { alerts, machines } = useNoblinks();

  function getMachineName(machineId: string): string {
    return machines.find((m) => m.id === machineId)?.name ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alerts</h1>

      {alerts.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No alerts yet"
          description="Alerts will appear here when monitors detect issues."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Alert</th>
                <th className="px-4 py-3 text-left font-medium">Severity</th>
                <th className="px-4 py-3 text-left font-medium">Machine</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Triggered</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  machineName={getMachineName(alert.machineId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
