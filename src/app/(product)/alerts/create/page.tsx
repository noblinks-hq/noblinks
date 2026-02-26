"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Sparkles,
  Check,
  AlertTriangle,
  Code,
  Server,
  Gauge,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { SeverityBadge } from "@/components/product/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { AlertSeverity } from "@/lib/types";

interface AiResult {
  matched: boolean;
  capabilityKey?: string;
  capabilityName?: string;
  alertTemplate?: string;
  params?: { machine: string; threshold: number; window: string };
  severity?: string;
  alertName?: string;
  description?: string;
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

const SEVERITY_OPTIONS: AlertSeverity[] = ["critical", "warning", "info"];

export default function CreateAlertPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorKind, setErrorKind] = useState<ErrorKind>("api");

  // Editable fields (initialized from AI result)
  const [editThreshold, setEditThreshold] = useState(80);
  const [editWindow, setEditWindow] = useState("5m");
  const [editSeverity, setEditSeverity] = useState<AlertSeverity>("warning");
  const [editing, setEditing] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");

  async function handleAnalyze() {
    if (!prompt.trim()) return;

    setStep("analyzing");
    setErrorMessage("");

    try {
      const res = await fetch("/api/chat/create-alert", {
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

      const data: AiResult = await res.json();
      setAiResult(data);

      if (data.matched && data.params) {
        setEditThreshold(data.params.threshold);
        setEditWindow(data.params.window);
        setEditSeverity((data.severity || "warning") as AlertSeverity);
        setStep("review");
      } else {
        setErrorKind("no_match");
        setErrorMessage(
          data.noMatchReason || "Could not match your request to any capability."
        );
        setStep("error");
      }
    } catch (err) {
      if (!errorKind) setErrorKind("api");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStep("error");
    }
  }

  async function handleConfirm(force = false) {
    if (!aiResult?.matched || !aiResult.params || !aiResult.capabilityKey) return;

    setStep("creating");
    setDuplicateWarning("");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capabilityKey: aiResult.capabilityKey,
          machine: aiResult.params.machine,
          threshold: editThreshold,
          window: editWindow,
          severity: editSeverity,
          name: aiResult.alertName,
          description: aiResult.description,
          force,
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setDuplicateWarning(data.message);
        setStep("review");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create alert");
      }

      setStep("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create alert"
      );
      setStep("error");
    }
  }

  function handleReset() {
    setStep("input");
    setPrompt("");
    setAiResult(null);
    setErrorMessage("");
    setErrorKind("api");
    setEditing(false);
    setDuplicateWarning("");
  }

  function getPromqlPreview(): string {
    if (!aiResult?.params || !aiResult.alertTemplate) return "";
    return aiResult.alertTemplate
      .replace(/\$machine/g, aiResult.params.machine)
      .replace(/\$threshold/g, String(editThreshold))
      .replace(/\$window/g, editWindow);
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/alerts" className="hover:text-foreground">
          Alerts
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Create Alert</span>
      </nav>

      {/* Step: Input */}
      {step === "input" && (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Create Alert with AI</CardTitle>
            <CardDescription>
              Describe the alert you want in plain English. Our AI will match it
              to the right monitoring capability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder='e.g. "Alert me if memory usage is above 80% on prod-server-1"'
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
                "Alert me if CPU is above 90% on web-server-1",
                "Warn when disk usage exceeds 85% on db-primary",
                "Memory alert for staging-api at 75% threshold over 10m",
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
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyze} disabled={!prompt.trim()}>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step: Analyzing */}
      {step === "analyzing" && (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="font-medium">Analyzing your request...</p>
              <p className="text-sm text-muted-foreground">
                Matching to available monitoring capabilities
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {step === "review" && aiResult?.matched && aiResult.params && (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Review Alert</CardTitle>
            <CardDescription>
              Verify the details below before creating your alert.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Alert Name */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Alert Name
              </p>
              <p className="text-lg font-semibold">{aiResult.alertName}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Capability
                  </p>
                  <p className="text-sm">{aiResult.capabilityName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Server className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Machine
                  </p>
                  <p className="text-sm">{aiResult.params.machine}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Gauge className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="w-full">
                  <p className="text-sm font-medium text-muted-foreground">
                    Threshold
                  </p>
                  {editing ? (
                    <Input
                      type="number"
                      value={editThreshold}
                      onChange={(e) =>
                        setEditThreshold(Number(e.target.value))
                      }
                      className="mt-1 h-8 w-24"
                      min={1}
                      max={100}
                    />
                  ) : (
                    <p className="text-sm">{editThreshold}%</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="w-full">
                  <p className="text-sm font-medium text-muted-foreground">
                    Window
                  </p>
                  {editing ? (
                    <Input
                      value={editWindow}
                      onChange={(e) => setEditWindow(e.target.value)}
                      className="mt-1 h-8 w-24"
                      placeholder="5m"
                    />
                  ) : (
                    <p className="text-sm">{editWindow}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="w-full">
                  <p className="text-sm font-medium text-muted-foreground">
                    Severity
                  </p>
                  {editing ? (
                    <div className="mt-1 flex gap-2">
                      {SEVERITY_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditSeverity(s)}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                            editSeverity === s
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground"
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <SeverityBadge severity={editSeverity} />
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline">Configured (Not Deployed)</Badge>
              </div>
            </div>

            {/* PromQL Preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  PromQL Query
                </p>
              </div>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
                <code>{getPromqlPreview()}</code>
              </pre>
            </div>
          </CardContent>
          {duplicateWarning && (
            <CardContent className="pt-0">
              <div className="flex items-start gap-3 rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Duplicate detected
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {duplicateWarning}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConfirm(true)}
                >
                  Create Anyway
                </Button>
              </div>
            </CardContent>
          )}
          <CardFooter className="flex gap-3">
            <Button onClick={() => handleConfirm()} disabled={editing && !editWindow.trim()}>
              <Check className="mr-2 h-4 w-4" />
              Confirm &amp; Create
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Done Editing" : "Edit"}
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step: Creating */}
      {step === "creating" && (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <p className="font-medium">Creating alert...</p>
          </CardContent>
        </Card>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Alert Created</p>
              <p className="text-sm text-muted-foreground">
                Your alert has been saved with status &ldquo;Configured (Not
                Deployed)&rdquo;.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/alerts")}>
                View All Alerts
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Error — API / provider failure */}
      {step === "error" && errorKind === "api" && (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-4 py-8">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold">AI service error</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleReset}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/alerts")}>
                Back to Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Error — No matching capability */}
      {step === "error" && errorKind === "no_match" && (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-4 py-8">
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
                    Try describing an alert using one of these capabilities:
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

            <div className="flex gap-3">
              <Button onClick={handleReset}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/alerts")}>
                Back to Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
