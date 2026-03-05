"use client";

import { useState } from "react";
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
import type { DbMachine } from "@/lib/types";

interface AddMachineToEnvModalProps {
  environmentId: string;
  onAdded: (machine: DbMachine) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AddMachineToEnvModal({
  environmentId,
  onAdded,
  open,
  onOpenChange,
}: AddMachineToEnvModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("linux");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          environmentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add machine");
      }

      const data = (await res.json()) as { machine: DbMachine };
      toast.success("Machine added");
      setName("");
      setCategory("linux");
      onAdded(data.machine);
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
            <DialogTitle>Add Machine</DialogTitle>
            <DialogDescription>
              Add a new machine to this environment. You will be able to connect
              it after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="machine-name">Machine Name</Label>
              <Input
                id="machine-name"
                placeholder="e.g. web-01"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine-type">Type</Label>
              <select
                id="machine-type"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm"
              >
                <option value="linux">Linux</option>
                <option value="kubernetes">Kubernetes</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Machine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
