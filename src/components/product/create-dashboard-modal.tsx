"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DashboardCategory } from "@/lib/types";

export function CreateDashboardModal({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("");
  const [category, setCategory] = useState<DashboardCategory>("infrastructure");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !environment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          environment: environment.trim(),
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create dashboard");
      }

      toast.success("Dashboard created");
      setName("");
      setEnvironment("");
      setCategory("infrastructure");
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Dashboard</DialogTitle>
            <DialogDescription>
              Create a new monitoring dashboard for your infrastructure.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Name</Label>
              <Input
                id="dashboard-name"
                placeholder="e.g. Production Overview"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dashboard-environment">Environment</Label>
              <Input
                id="dashboard-environment"
                placeholder="e.g. production"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dashboard-category">Category</Label>
              <select
                id="dashboard-category"
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
              {submitting ? "Creating…" : "Create Dashboard"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
