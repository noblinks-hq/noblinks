"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  AlignLeft,
  BarChart2,
  Check,
  Gauge,
  PieChart,
  Sparkles,
  Wand2,
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
import type { DbMachine, WidgetType } from "@/lib/types";

interface AddWidgetModalProps {
  dashboardId: string;
  onCreated: () => void;
  // Optional controlled mode (used when opening from Browse Metrics)
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  prefillPrompt?: string;
  prefillMachine?: string;
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
  clarificationQuestion?: string;
  suggestions?: string[];
  generated?: boolean;
  generatedDescription?: string;
  generatedScrapeQuery?: string;
}

type Step = "input" | "analyzing" | "clarify" | "review-generated" | "review" | "creating" | "success" | "error";
type ErrorKind = "api" | "no_match";

const WIDGET_TYPE_OPTIONS: WidgetType[] = ["timeseries", "stat", "bar", "pie", "toplist"];

const WIDGET_TYPE_META: Record<WidgetType, { label: string; icon: React.ReactNode }> = {
  timeseries: { label: "Time Series", icon: <Activity className="h-3.5 w-3.5" /> },
  stat:       { label: "Stat",        icon: <Gauge className="h-3.5 w-3.5" /> },
  bar:        { label: "Bar Chart",   icon: <BarChart2 className="h-3.5 w-3.5" /> },
  pie:        { label: "Pie Chart",   icon: <PieChart className="h-3.5 w-3.5" /> },
  toplist:    { label: "Top List",    icon: <AlignLeft className="h-3.5 w-3.5" /> },
};

export function AddWidgetModal({ dashboardId, onCreated, externalOpen, onExternalOpenChange, prefillPrompt, prefillMachine }: AddWidgetModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");
  const [aiResult, setAiResult] = useState<AiWidgetResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorKind, setErrorKind] = useState<ErrorKind>("api");
  const [machines, setMachines] = useState<DbMachine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState("");

  // Editable fields (initialized from AI result)
  const [editTitle, setEditTitle] = useState("");
  const [editMachine, setEditMachine] = useState("");
  const [editType, setEditType] = useState<WidgetType>("timeseries");
  const [editing, setEditing] = useState(false);

  // Fetch machines when modal opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/machines")
      .then((r) => (r.ok ? r.json() : { machines: [] }))
      .then((data: { machines: DbMachine[] }) => setMachines(data.machines))
      .catch(() => {});
  }, [open]);

  function handleReset(initialPrompt = "", initialMachine = "") {
    setStep("input");
    setPrompt(initialPrompt);
    setAiResult(null);
    setErrorMessage("");
    setErrorKind("api");
    setEditing(false);
    setEditTitle("");
    setEditMachine(initialMachine);
    setEditType("timeseries");
    setSelectedMachine(initialMachine);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isControlled) {
      onExternalOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
    if (nextOpen) {
      handleReset(prefillPrompt ?? "", prefillMachine ?? "");
    }
  }

  async function handleAnalyze() {
    if (!prompt.trim()) return;

    setStep("analyzing");
    setErrorMessage("");

    // Append selected machine to prompt so AI always has a concrete machine name
    const fullPrompt = selectedMachine
      ? `${prompt.trim()} on machine ${selectedMachine}`
      : prompt.trim();

    try {
      const res = await fetch("/api/chat/create-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          machineName: selectedMachine || undefined,
        }),
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
        setEditMachine(selectedMachine || data.machine);
        setEditType(data.widgetType);
        setStep(data.generated ? "review-generated" : "review");
      } else if (data.errorType === "vague") {
        setStep("clarify");
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
    handleOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Add Widget
          </Button>
        </DialogTrigger>
      )}
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Machine</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm"
                >
                  <option value="">Select a machine...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}{m.hostname && m.hostname !== m.name ? ` (${m.hostname})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">What do you want to visualize?</label>
                <Textarea
                  placeholder='e.g. "CPU usage over time" or "memory trend"'
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
              </div>
              <div className="flex flex-wrap gap-2">
                <p className="w-full text-xs text-muted-foreground">Quick picks:</p>
                {["CPU usage", "Memory usage", "Disk usage"].map((example) => (
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
              <Button onClick={handleAnalyze} disabled={!prompt.trim() || !selectedMachine}>
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
                Querying your machine and matching to capabilities
              </p>
            </div>
          </div>
        )}

        {/* Step: Clarify */}
        {step === "clarify" && (
          <>
            <DialogHeader>
              <DialogTitle>Can you be more specific?</DialogTitle>
              <DialogDescription>
                {aiResult?.clarificationQuestion ?? "Your request is a bit vague — try one of the suggestions below or rewrite it."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {aiResult?.suggestions && aiResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suggestions</p>
                  <div className="flex flex-col gap-2">
                    {aiResult.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setPrompt(s);
                          setStep("input");
                        }}
                        className="rounded-md border bg-muted/50 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted hover:border-foreground/30"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Or rewrite your prompt</p>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button onClick={handleAnalyze} disabled={!prompt.trim()}>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze
              </Button>
              <Button variant="ghost" onClick={() => handleReset()}>Cancel</Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Review Generated Capability */}
        {step === "review-generated" && aiResult?.matched && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-amber-500" />
                New Capability Generated
              </DialogTitle>
              <DialogDescription>
                No existing capability matched your request, so the AI created one.
                Review the details and query below before adding to your dashboard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Capability name + description */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-sm font-semibold">{aiResult.capabilityName}</p>
                </div>
                {aiResult.generatedDescription && (
                  <p className="text-sm text-muted-foreground">{aiResult.generatedDescription}</p>
                )}
              </div>

              {/* Scrape query */}
              {aiResult.generatedScrapeQuery && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Prometheus Query</p>
                  <p className="text-xs text-muted-foreground">
                    This PromQL expression will be evaluated every 30s on your machine.
                  </p>
                  <code className="block rounded-md bg-muted px-3 py-2.5 text-xs leading-relaxed break-all whitespace-pre-wrap">
                    {aiResult.generatedScrapeQuery}
                  </code>
                </div>
              )}

              {/* Widget preview */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Widget title</p>
                  <p className="font-medium">{editTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Machine</p>
                  <p className="font-medium">{editMachine}</p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button onClick={() => setStep("review")}>
                <Check className="mr-2 h-4 w-4" />
                Looks good, proceed
              </Button>
              <Button variant="ghost" onClick={() => handleReset()}>
                Cancel
              </Button>
            </DialogFooter>
          </>
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
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {WIDGET_TYPE_OPTIONS.map((t) => {
                        const meta = WIDGET_TYPE_META[t];
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEditType(t)}
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                              editType === t
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-muted-foreground hover:border-foreground"
                            }`}
                          >
                            {meta.icon}{meta.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="mt-1 gap-1">
                      {WIDGET_TYPE_META[editType]?.icon}
                      {WIDGET_TYPE_META[editType]?.label ?? editType}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Machine
                  </p>
                  {editing ? (
                    <select
                      value={editMachine}
                      onChange={(e) => setEditMachine(e.target.value)}
                      className="border-input bg-background mt-1 h-8 w-full rounded-md border px-2 text-sm"
                    >
                      {machines.map((m) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
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
              <Button variant="ghost" onClick={() => handleReset()}>
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
              <Button onClick={() => handleReset()}>Try Again</Button>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
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
            <DialogFooter>
              <Button onClick={() => handleReset()}>Try Again</Button>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
