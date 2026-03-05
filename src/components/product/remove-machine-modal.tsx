"use client";

import { useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
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
import type { DbMachine } from "@/lib/types";

interface RemoveMachineModalProps {
  machine: DbMachine;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRemoved: () => void;
}

const UNINSTALL_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.noblinks.com"}/uninstall.sh`;
const UNINSTALL_CMD = `curl -fsSL ${UNINSTALL_URL} | sudo bash`;

export function RemoveMachineModal({
  machine,
  open,
  onOpenChange,
  onRemoved,
}: RemoveMachineModalProps) {
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(UNINSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/machines/${machine.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to remove machine");
      }
      toast.success(`${machine.name} removed`);
      onOpenChange(false);
      onRemoved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Remove {machine.name}
          </DialogTitle>
          <DialogDescription>
            First run the uninstall command on the machine to remove the agent,
            then remove it from noblinks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              1. Run on <span className="font-mono">{machine.hostname ?? machine.name}</span>
            </p>
            <div className="relative">
              <pre className="rounded-md bg-muted px-4 py-3 pr-12 text-xs leading-relaxed break-all whitespace-pre-wrap">
                {UNINSTALL_CMD}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Stops and removes: noblinks-agent, Prometheus, Alertmanager, node_exporter, all config and data.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">2. Remove from noblinks</p>
            <p className="text-sm text-muted-foreground">
              This removes the machine record and all its associated alerts from noblinks. This cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={removing}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={removing}>
            {removing ? "Removing..." : "Remove from noblinks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
