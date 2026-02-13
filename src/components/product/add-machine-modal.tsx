"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { useNoblinks } from "@/context/noblinks-context";
import { generateId } from "@/lib/mock-data";
import type { MachineType } from "@/lib/types";

export function AddMachineModal() {
  const { addMachine } = useNoblinks();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<MachineType>("linux");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    addMachine({
      id: generateId(),
      name: name.trim(),
      type,
      status: "online",
      lastSeen: "Just now",
    });

    setName("");
    setType("linux");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Machine
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Machine</DialogTitle>
            <DialogDescription>
              Connect a new machine to Noblinks for monitoring.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="machine-name">Machine Name</Label>
              <Input
                id="machine-name"
                placeholder="e.g. prod-api-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine-type">Machine Type</Label>
              <select
                id="machine-type"
                value={type}
                onChange={(e) => setType(e.target.value as MachineType)}
                className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm"
              >
                <option value="linux">Linux VM</option>
                <option value="windows">Windows VM</option>
                <option value="kubernetes">Kubernetes Cluster</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit">Add Machine</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
