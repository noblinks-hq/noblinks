"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  Gauge,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { WidgetType } from "@/lib/types";

interface AddWidgetModalProps {
  dashboardId: string;
  onCreated: () => void;
}

interface AiWidgetResult {
  matched: boolean;
  capabilityKey?: string;
  capabilityName?: string;
  widgetTitle?: string;
  widgetType?: WidgetType;
  machine?: string;
  metric?: string;
  errorType?: string;
  noMatchReason?: string;
  availableCapabilities?: {
    key: string;
    name: string;
    description: string;
    category: string;
  }[];
}

type Step = "input" | "analyzing" | "review" | "creating" | "success" | "error";
type ErrorKind = "api" | "no_match";

const WIDGET_TYPE_OPTIONS: WidgetType[] = ["timeseries", "stat"];

export function AddWidgetModal({ dashboardId, onCreated }: AddWidgetModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");
  const [aiResult, setAiResult] = useState<AiWidgetResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorKind, setErrorKind] = useState<ErrorKind>("api");

  // Editable fields (initialized from AI result)
  const [editTitle, setEditTitle] = useState("");
  const [editMachine, setEditMachine] = useState("");
  const [editType, setEditType] = useState<WidgetType>("timeseries");
  const [editing, setEditing] = useState(false);

  function handleReset() {
    setStep("input");
    setPrompt("");
    setAiResult(null);
    setErrorMessage("");
    setErrorKind("api");
    setEditing(false);
    setEditTitle("");
    setEditMachine("");
    setEditType("timeseries");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      handleReset();
    }
  }

  async function handleAnalyze() {
    if (!prompt.trim()) return;

    setStep("analyzing");
    setErrorMessage("");

    try {
      const res = await fetch("/api/chat/create-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorKind("api");
        const msg = data.detail
          ? `${data.error}\n\nDetail: ${data.detail}`
          : data.error || "Failed to analyze your request";
        throw new Error(msg);
      }

      const data: AiWidgetResult = await res.json();
      setAiResult(data);

      if (data.matched && data.widgetTitle && data.machine && data.widgetType) {
        setEditTitle(data.widgetTitle);
        setEditMachine(data.machine);
        setEditType(data.widgetType);
        setStep("review");
      } else {
        setErrorKind("no_match");
        setErrorMessage(
          data.noMatchReason ||
            "Could not match your request to any capability."
        );
        setStep("error");
      }
    } catch (err) {
      if (errorKind !== "no_match") setErrorKind("api");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStep("error");
    }
  }

  async function handleConfirm() {
    if (!aiResult?.matched || !aiResult.metric) return;

    setStep("creating");

    try {
      const res = await fetch(`/api/dashboards/${dashboardId}/widgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          type: editType,
          metric: aiResult.metric,
          machine: editMachine,
          capabilityKey: aiResult.capabilityKey ?? null,
          thresholdValue: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add widget");
      }

      setStep("success");
    } catch (err) {
      setErrorKind("api");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to add widget"
      );
      setStep("error");
    }
  }

  function handleDone() {
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="mr-2 h-4 w-4" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        {/* Step: Input */}
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>Add Widget with AI</DialogTitle>
              <DialogDescription>
                Describe the metric you want to visualize in plain English.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder='e.g. "Show CPU usage on web-server-1 over time"'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <p className="w-full text-xs text-muted-foreground">
                  Examples:
                </p>
                {[
                  "Show CPU usage on web-server-1",
                  "Memory usage trend for db-primary",
                  "Disk space on prod-server",
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="rounded-md border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAnalyze} disabled={!prompt.trim()}>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Analyzing */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="font-medium">Analyzing your request...</p>
              <p className="text-sm text-muted-foreground">
                Matching to available monitoring capabilities
              </p>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && aiResult?.matched && (
          <>
            <DialogHeader>
              <DialogTitle>Review Widget</DialogTitle>
              <DialogDescription>
                Verify the widget configuration before adding it to your
                dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              {/* Widget Title */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Widget Title
                </p>
                {editing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg font-semibold">{editTitle}</p>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Type
                  </p>
                  {editing ? (
                    <div className="mt-1 flex gap-2">
                      {WIDGET_TYPE_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditType(t)}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                            editType === t
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground"
                          }`}
                        >
                          {t === "timeseries" ? "Time Series" : "Stat"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="mt-1">
                      {editType === "timeseries" ? (
                        <>
                          <Activity className="mr-1 h-3 w-3" />
                          Time Series
                        </>
                      ) : (
                        <>
                          <Gauge className="mr-1 h-3 w-3" />
                          Stat
                        </>
                      )}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Machine
                  </p>
                  {editing ? (
                    <Input
                      value={editMachine}
                      onChange={(e) => setEditMachine(e.target.value)}
                      className="mt-1 h-8"
                    />
                  ) : (
                    <p className="mt-1 text-sm">{editMachine}</p>
                  )}
                </div>
                {aiResult.capabilityName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Capability
                    </p>
                    <p className="mt-1 text-sm">{aiResult.capabilityName}</p>
                  </div>
                )}
              </div>

              {/* Metric Preview */}
              {aiResult.metric && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Metric
                  </p>
                  <code className="block truncate rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {aiResult.metric}
                  </code>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                onClick={handleConfirm}
                disabled={!editTitle.trim() || !editMachine.trim()}
              >
                <Check className="mr-2 h-4 w-4" />
                Add to Dashboard
              </Button>
              <Button variant="outline" onClick={() => setEditing(!editing)}>
                {editing ? "Done Editing" : "Edit"}
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Creating */}
        {step === "creating" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <p className="font-medium">Adding widget...</p>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Widget Added</p>
              <p className="text-sm text-muted-foreground">
                Your widget has been added to the dashboard.
              </p>
            </div>
            <Button onClick={handleDone}>Done</Button>
          </div>
        )}

        {/* Step: Error -- API / provider failure */}
        {step === "error" && errorKind === "api" && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold">AI service error</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleReset}>Try Again</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Error -- No matching capability */}
        {step === "error" && errorKind === "no_match" && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold">No matching capability</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>

            {aiResult?.availableCapabilities &&
              aiResult.availableCapabilities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Try describing a widget using one of these capabilities:
                  </p>
                  <div className="grid gap-2">
                    {aiResult.availableCapabilities.map((cap) => (
                      <div
                        key={cap.key}
                        className="rounded-md border bg-muted/50 px-3 py-2"
                      >
                        <p className="text-sm font-medium">{cap.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cap.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <DialogFooter>
              <Button onClick={handleReset}>Try Again</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
