"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
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

type Step = "install" | "waiting" | "connected";

interface ConnectMachineModalProps {
  machine: DbMachine;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConnected?: () => void;
}

export function ConnectMachineModal({
  machine,
  open,
  onOpenChange,
  onConnected,
}: ConnectMachineModalProps) {
  const [step, setStep] = useState<Step>("install");
  const [orgToken, setOrgToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectedMachine, setConnectedMachine] = useState<DbMachine | null>(
    null
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch org token when the component mounts (parent conditionally renders
  // this component, so it remounts each time a new machine is selected).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/org/agent-token")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { token: string } | null) => {
        if (!cancelled && data) setOrgToken(data.token);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll for connection status
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/machines/${machine.id}`);
        if (res.ok) {
          const data = (await res.json()) as { machine: DbMachine };
          if (data.machine.status === "online") {
            setConnectedMachine(data.machine);
            setStep("connected");
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
  }, [machine.id]);

  // Clean up polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  function handleAdvanceToWaiting() {
    setStep("waiting");
    startPolling();
  }

  function handleDone() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    onOpenChange(false);
    onConnected?.();
  }

  const installCommand = orgToken
    ? `curl -fsSL ${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.noblinks.com"}/install.sh | sudo bash -s -- --token ${orgToken} --name "${machine.name}"`
    : "Loading...";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "connected"
              ? "Machine Connected"
              : `Connect ${machine.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === "install" &&
              "Run the following command on your machine to install the Noblinks agent."}
            {step === "waiting" &&
              "Waiting for the agent to connect..."}
            {step === "connected" &&
              "Your machine is now connected and reporting."}
          </DialogDescription>
        </DialogHeader>

        {step === "install" && (
          <div className="mt-4 space-y-4">
            <div className="relative">
              <pre className="whitespace-pre-wrap break-all rounded-lg bg-muted p-4 pr-12 text-xs leading-relaxed">
                {installCommand}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={handleCopy}
                disabled={!orgToken}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "waiting" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Waiting for <span className="font-medium">{machine.name}</span> to
              come online...
            </p>
          </div>
        )}

        {step === "connected" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">{machine.name}</p>
            {connectedMachine?.ip && (
              <p className="text-sm text-muted-foreground">
                IP: {connectedMachine.ip}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "install" && (
            <Button onClick={handleAdvanceToWaiting} disabled={!orgToken}>
              I&apos;ve run the command
            </Button>
          )}
          {step === "connected" && <Button onClick={handleDone}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
