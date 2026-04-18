"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText, CheckCircle2, AlertTriangle, XCircle,
  Loader2, ArrowLeft, RefreshCw, ChevronDown, ExternalLink,
  ArrowRight, Server, ShieldAlert, ShieldCheck, Info,
} from "lucide-react";
import { PageHeader } from "@/components/product/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Resource {
  id: string;
  name?: string;
  type?: string;
  region?: string;
  extra?: Record<string, string>;
}

interface MatchResult {
  service: string;
  count: number;
  resources: Resource[];
  match: "compatible" | "partial" | "none";
  hetznerEquivalent: string;
  notes: string;
  migrationEffort: "low" | "medium" | "high";
  migrationNotes: string[];
  hetznerDocs: string | null;
  weight: number;
  aiMapping?: string;
}

type ComplianceSeverity = "critical" | "warning" | "info";
type ComplianceRegulation = "cloud_act" | "gdpr" | "schrems2" | "eu_ai_act" | "nis2" | "sovereignty";

interface ComplianceFlag {
  id: string;
  regulation: ComplianceRegulation;
  severity: ComplianceSeverity;
  title: string;
  description: string;
  legalReference: string;
  remediation: string;
  precedent?: string;
  triggeredBy: string[];
}

interface Analysis {
  id: string;
  status: "pending" | "running" | "complete" | "failed";
  targetCloud: string;
  inputMethod: string;
  errorMessage?: string;
  scoringResult?: { score: number; totalServices: number };
  matchResults?: MatchResult[];
  complianceFlags?: ComplianceFlag[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MATCH_CONFIG = {
  compatible: {
    label: "Compatible",
    icon: CheckCircle2,
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-l-green-500",
    iconColor: "text-green-500",
  },
  partial: {
    label: "Partial match",
    icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    border: "border-l-amber-500",
    iconColor: "text-amber-500",
  },
  none: {
    label: "No match",
    icon: XCircle,
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    border: "border-l-red-500",
    iconColor: "text-red-500",
  },
};

const EFFORT_CONFIG = {
  low:    { label: "Low effort",    color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30" },
  medium: { label: "Medium effort", color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" },
  high:   { label: "High effort",   color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30" },
};

const SEVERITY_CONFIG: Record<ComplianceSeverity, {
  icon: typeof ShieldAlert;
  label: string;
  color: string;
  border: string;
  badge: string;
}> = {
  critical: {
    icon: ShieldAlert,
    label: "Critical",
    color: "text-red-600 dark:text-red-400",
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-amber-600 dark:text-amber-400",
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  info: {
    icon: Info,
    label: "Info",
    color: "text-blue-600 dark:text-blue-400",
    border: "border-l-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

const REGULATION_LABELS: Record<ComplianceRegulation, string> = {
  cloud_act: "CLOUD Act",
  gdpr: "GDPR",
  schrems2: "Schrems II",
  eu_ai_act: "EU AI Act",
  nis2: "NIS2",
  sovereignty: "Sovereignty",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreLabel(score: number) {
  if (score >= 75) return "Good compatibility";
  if (score >= 50) return "Partial compatibility";
  return "Low compatibility";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Compliance flag card
// ---------------------------------------------------------------------------

function ComplianceFlagCard({ flag }: { flag: ComplianceFlag }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[flag.severity];
  const SeverityIcon = cfg.icon;

  return (
    <div className={cn("rounded-lg border border-l-4 transition-all", cfg.border)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors rounded-lg"
      >
        <SeverityIcon className={cn("h-4 w-4 shrink-0", cfg.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={cn("text-xs font-medium", cfg.badge)}>
              {cfg.label}
            </Badge>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {REGULATION_LABELS[flag.regulation]}
            </span>
          </div>
          <p className="text-sm font-medium mt-1 leading-snug">{flag.title}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t pt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{flag.description}</p>

          {flag.precedent && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 mb-1">Documented precedent</p>
              <p className="text-sm text-red-800 dark:text-red-300">{flag.precedent}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legal reference</p>
              <p className="text-sm font-medium">{flag.legalReference}</p>
            </div>
            <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remediation</p>
              <p className="text-sm">{flag.remediation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score ring
// ---------------------------------------------------------------------------

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/40" />
          <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className={cn("transition-all duration-700",
              score >= 75 ? "stroke-green-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-3xl font-bold", scoreColor(score))}>{score}%</span>
        </div>
      </div>
      <p className={cn("text-sm font-medium", scoreColor(score))}>{scoreLabel(score)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expandable service card
// ---------------------------------------------------------------------------

function ServiceCard({ result }: { result: MatchResult }) {
  const [open, setOpen] = useState(false);
  const cfg = MATCH_CONFIG[result.match];
  const Icon = cfg.icon;
  const effort = EFFORT_CONFIG[result.migrationEffort];

  return (
    <div className={cn("rounded-lg border border-l-4 transition-all", cfg.border)}>
      {/* Header — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors rounded-lg"
      >
        <Icon className={cn("h-4 w-4 shrink-0", cfg.iconColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold text-sm uppercase tracking-wide">{result.service}</span>
            <Badge variant="secondary" className={cn("text-xs", cfg.badge)}>{cfg.label}</Badge>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", effort.color)}>{effort.label}</span>
            {result.count > 0 && (
              <span className="text-xs text-muted-foreground">{result.count} resource{result.count !== 1 ? "s" : ""}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {result.hetznerEquivalent !== "None" ? `→ ${result.hetznerEquivalent}` : "No equivalent on Hetzner"}
          </p>
        </div>

        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5 border-t pt-4 space-y-4">
          {/* Summary note */}
          <p className="text-sm text-muted-foreground">{result.notes}</p>

          {/* Top row — two cards side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Left card — Detected in AWS */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detected in AWS</p>
              {result.resources.length > 0 ? (
                <div className="divide-y">
                  {result.resources.map((r) => (
                    <div key={r.id} className="flex items-start gap-2 py-2 first:pt-0 last:pb-0">
                      <Server className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">{r.name ?? r.id}</p>
                        {r.name && r.name !== r.id && (
                          <p className="text-xs text-muted-foreground font-mono">{r.id}</p>
                        )}
                        {r.type && <p className="text-xs text-muted-foreground">{r.type}</p>}
                        {r.extra && Object.entries(r.extra).map(([k, v]) => (
                          <p key={k} className="text-xs text-muted-foreground">{k}: {v}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No resource details available</p>
              )}
            </div>

            {/* Right card — Hetzner mapping */}
            <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Migrates to</p>
                <p className="text-sm font-semibold text-primary leading-snug">
                  {result.hetznerEquivalent !== "None" ? result.hetznerEquivalent : "No direct equivalent"}
                </p>
              </div>
              {result.hetznerDocs && (
                <a
                  href={result.hetznerDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Hetzner documentation
                </a>
              )}
            </div>
          </div>

          {/* Migration suggestions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Migration steps</p>
            <ul className="space-y-2">
              {(result.aiMapping
                ? result.aiMapping.split("\n").filter(Boolean).map((l) => l.replace(/^→\s*/, ""))
                : result.migrationNotes
              ).map((note, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm rounded-lg border bg-muted/20 px-4 py-2.5">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

function RunningState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <div className="text-center">
        <p className="font-semibold text-lg">Analysis in progress</p>
        <p className="text-sm text-muted-foreground mt-1">This usually takes 30–60 seconds. Page refreshes automatically.</p>
      </div>
    </div>
  );
}

function FailedState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <XCircle className="h-10 w-10 text-destructive" />
      <div className="text-center">
        <p className="font-semibold text-lg">Analysis failed</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalysis() {
    try {
      const res = await fetch(`/api/lens/reports/${id}`);
      if (res.ok) setAnalysis(await res.json() as Analysis);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAnalysis(); }, [id]);

  useEffect(() => {
    if (!analysis || analysis.status === "complete" || analysis.status === "failed") return;
    const interval = setInterval(fetchAnalysis, 3000);
    return () => clearInterval(interval);
  }, [analysis?.status]);

  const results = analysis?.matchResults ?? [];
  const score = analysis?.scoringResult?.score ?? 0;
  const compatible = results.filter((r) => r.match === "compatible").length;
  const partial = results.filter((r) => r.match === "partial").length;
  const none = results.filter((r) => r.match === "none").length;

  // Sort: none first (highest impact), then partial, then compatible
  const sorted = [...results].sort((a, b) => {
    const order = { none: 0, partial: 1, compatible: 2 };
    return order[a.match] - order[b.match];
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-4">
      <PageHeader
        title={analysis ? `${analysis.targetCloud} Report` : "Report"}
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/lens")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Overview
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchAnalysis}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {loading && <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
      {!loading && analysis?.status === "running" && <div className="rounded-xl border bg-card shadow-sm"><RunningState /></div>}
      {!loading && analysis?.status === "failed" && <div className="rounded-xl border bg-card shadow-sm"><FailedState message={analysis.errorMessage ?? "Unknown error"} /></div>}

      {!loading && analysis?.status === "complete" && (
        <>
          {/* Score + meta */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={score} />
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Target cloud</p>
                    <p className="font-semibold mt-0.5">{analysis.targetCloud}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Analysed</p>
                    <p className="font-semibold mt-0.5">{formatDate(analysis.createdAt)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Compatible", value: compatible, color: "text-green-600 dark:text-green-400" },
                    { label: "Partial", value: partial, color: "text-amber-600 dark:text-amber-400" },
                    { label: "No match", value: none, color: "text-red-600 dark:text-red-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center gap-1 rounded-xl border bg-muted/30 px-4 py-3">
                      <span className={cn("text-2xl font-bold", color)}>{value}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & sovereignty flags */}
          {(analysis.complianceFlags ?? []).length > 0 && (() => {
            const flags = analysis.complianceFlags!;
            const critical = flags.filter((f) => f.severity === "critical").length;
            const warning = flags.filter((f) => f.severity === "warning").length;
            const info = flags.filter((f) => f.severity === "info").length;
            return (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                      Compliance &amp; Sovereignty Risks
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">Deterministic rules — no AI. Based on detected services and EU law.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {critical > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {critical} critical
                      </span>
                    )}
                    {warning > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {warning} warning
                      </span>
                    )}
                    {info > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {info} info
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {flags.map((flag) => <ComplianceFlagCard key={flag.id} flag={flag} />)}
                </div>
                {critical === 0 && warning === 0 && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-green-600 dark:text-green-400">
                    <ShieldCheck className="h-4 w-4" />
                    No critical compliance issues detected.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Service breakdown */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Service Breakdown</h2>
              <p className="text-xs text-muted-foreground">Click any service to expand details</p>
            </div>
            <div className="space-y-2">
              {sorted.length === 0 && (
                <p className="text-sm text-muted-foreground">No services detected in this AWS account.</p>
              )}
              {sorted.map((r) => <ServiceCard key={r.service} result={r} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
