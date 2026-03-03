"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy, Loader2, Plus, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbMachine } from "@/lib/types";

type Step = "install" | "waiting" | "connected";

export function AddMachineModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("install");
  const [orgToken, setOrgToken] = useState<string>("");
  const [loadingToken, setLoadingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectedMachine, setConnectedMachine] = useState<DbMachine | null>(
    null
  );
  const knownIdsRef = useRef<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch org token when modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    fetch("/api/org/agent-token")
      .then((r) => r.json())
      .then((data: { token?: string }) => {
        if (!cancelled && data.token) setOrgToken(data.token);
      })
      .finally(() => {
        if (!cancelled) setLoadingToken(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Snapshot existing machine IDs when entering waiting step
  async function startWaiting() {
    const res = await fetch("/api/machines?unassigned=true");
    if (res.ok) {
      const data = (await res.json()) as { machines: DbMachine[] };
      knownIdsRef.current = new Set(data.machines.map((m) => m.id));
    }
    setStep("waiting");
  }

  // Poll for new machines while in waiting step
  useEffect(() => {
    if (step !== "waiting") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/machines?unassigned=true");
      if (!res.ok) return;
      const data = (await res.json()) as { machines: DbMachine[] };
      const newMachine = data.machines.find(
        (m) => !knownIdsRef.current.has(m.id)
      );
      if (newMachine) {
        setConnectedMachine(newMachine);
        setStep("connected");
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step]);

  function handleClose() {
    setOpen(false);
    setStep("install");
    setConnectedMachine(null);
    setCopied(false);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  const installCommand = orgToken
    ? `curl -fsSL https://app.noblinks.io/install.sh | sudo bash -s -- --token ${orgToken}`
    : "";

  function copyCommand() {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          handleClose();
        } else {
          // Reset state before opening so the effect only fetches the token
          setStep("install");
          setConnectedMachine(null);
          setCopied(false);
          setLoadingToken(true);
          setOpen(true);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Machine
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        {/* Step 1: Install */}
        {step === "install" && (
          <>
            <DialogHeader>
              <DialogTitle>Connect a Machine</DialogTitle>
              <DialogDescription>
                Run this command on your Linux machine to install the noblinks
                agent.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    {loadingToken ? (
                      <span className="text-sm text-muted-foreground">
                        Loading...
                      </span>
                    ) : (
                      <code className="break-all font-mono text-xs leading-relaxed">
                        {installCommand}
                      </code>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={copyCommand}
                    disabled={!orgToken}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {copied && (
                  <p className="mt-2 text-xs text-green-600">
                    Copied to clipboard
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                This installs: node_exporter, Prometheus, Alertmanager, and the
                noblinks-agent
              </p>
            </div>

            <div className="mt-2 flex justify-end">
              <Button onClick={startWaiting} disabled={!orgToken}>
                Waiting for connection &rarr;
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Waiting */}
        {step === "waiting" && (
          <>
            <DialogHeader>
              <DialogTitle>Waiting for Agent</DialogTitle>
              <DialogDescription>
                Run the install command on your machine. This will update
                automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Waiting for agent to connect...
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("install")}>
                &larr; Back
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Connected */}
        {step === "connected" && connectedMachine && (
          <>
            <DialogHeader>
              <DialogTitle>Machine Connected</DialogTitle>
              <DialogDescription>
                Your machine has been discovered and is ready to be assigned.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="space-y-1 text-center">
                <p className="text-lg font-semibold">{connectedMachine.name}</p>
                {connectedMachine.ip && (
                  <p className="text-sm text-muted-foreground">
                    {connectedMachine.ip}
                  </p>
                )}
                {connectedMachine.hostname &&
                  connectedMachine.hostname !== connectedMachine.name && (
                    <p className="text-sm text-muted-foreground">
                      {connectedMachine.hostname}
                    </p>
                  )}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                The machine appears in{" "}
                <span className="font-medium text-foreground">
                  Discovered Machines
                </span>{" "}
                below. Assign it to a category to start monitoring.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
