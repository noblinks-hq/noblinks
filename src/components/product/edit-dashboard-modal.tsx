"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dashboard, DashboardCategory } from "@/lib/types";

export function EditDashboardModal({
  dashboard,
  open,
  onOpenChange,
  onUpdated,
}: {
  dashboard: Dashboard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState(dashboard.name);
  const [environment, setEnvironment] = useState(dashboard.environment);
  const [category, setCategory] = useState<DashboardCategory>(
    dashboard.category
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(dashboard.name);
    setEnvironment(dashboard.environment);
    setCategory(dashboard.category);
  }, [dashboard]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !environment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/dashboards/${dashboard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          environment: environment.trim(),
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update dashboard");
      }

      toast.success("Dashboard updated");
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Dashboard</DialogTitle>
            <DialogDescription>
              Update your dashboard settings.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dashboard-name">Name</Label>
              <Input
                id="edit-dashboard-name"
                placeholder="e.g. Production Overview"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dashboard-environment">Environment</Label>
              <Input
                id="edit-dashboard-environment"
                placeholder="e.g. production"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dashboard-category">Category</Label>
              <select
                id="edit-dashboard-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as DashboardCategory)
                }
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm"
              >
                <option value="infrastructure">Infrastructure</option>
                <option value="docker">Docker</option>
                <option value="kubernetes">Kubernetes</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
