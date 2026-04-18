"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScanSearch, Plus, CheckCircle2, XCircle, Clock, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/product/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Report {
  id: string;
  targetCloud: string;
  inputMethod: string;
  status: "pending" | "running" | "complete" | "failed";
  scoringResult: { score: number; totalServices: number } | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number) {
  if (score >= 75) return "bg-green-100 dark:bg-green-900/30";
  if (score >= 50) return "bg-amber-100 dark:bg-amber-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

const STATUS_CONFIG = {
  complete: { label: "Complete", icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
  running:  { label: "Running",  icon: Clock,        color: "text-blue-600 dark:text-blue-400" },
  pending:  { label: "Pending",  icon: Clock,        color: "text-muted-foreground" },
  failed:   { label: "Failed",   icon: XCircle,      color: "text-red-600 dark:text-red-400" },
};

const INPUT_METHOD_LABELS: Record<string, string> = {
  iam_role:   "IAM Role",
  terraform:  "Terraform",
  helm:       "Helm",
  cli_export: "CLI Export",
  manual:     "Manual",
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string | undefined }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LensOverviewPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lens/reports")
      .then((r) => r.json())
      .then((data) => setReports(data as Report[]))
      .finally(() => setLoading(false));
  }, []);

  const completed = reports.filter((r) => r.status === "complete");
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, r) => s + (r.scoringResult?.score ?? 0), 0) / completed.length)
    : null;

  const bestMatch = completed.reduce<Report | null>((best, r) => {
    if (!best || (r.scoringResult?.score ?? 0) > (best.scoringResult?.score ?? 0)) return r;
    return best;
  }, null);

  const lastCompleted = completed[0] ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-4">
      <PageHeader
        title="Overview"
        icon={ScanSearch}
        actions={
          <Button size="sm" asChild>
            <Link href="/lens/analyze">
              <Plus className="mr-2 h-4 w-4" />
              New Analysis
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Analyses" value={loading ? "—" : reports.length} />
        <StatCard
          label="Avg Compatibility"
          value={loading ? "—" : avgScore !== null ? `${avgScore}%` : "—"}
          {...(completed.length > 0 ? { sub: "across completed runs" } : {})}
        />
        <StatCard
          label="Best Match"
          value={loading ? "—" : bestMatch ? (bestMatch.targetCloud.split(" ")[0] ?? bestMatch.targetCloud) : "—"}
          {...(bestMatch?.scoringResult ? { sub: `${bestMatch.scoringResult.score}% compatible` } : {})}
        />
        <StatCard
          label="Services Mapped"
          value={loading ? "—" : lastCompleted?.scoringResult?.totalServices ?? "—"}
          {...(lastCompleted ? { sub: "last analysis" } : {})}
        />
      </div>

      {/* Recent analyses */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Analyses</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lens/reports">View all</Link>
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <p className="text-sm text-muted-foreground">No analyses yet. Run your first one to see results here.</p>
            <Button asChild size="sm">
              <Link href="/lens/analyze">Start analysis</Link>
            </Button>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="mt-4 space-y-3">
            {reports.slice(0, 5).map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-lg border px-5 py-4 transition-colors hover:bg-muted/50"
                >
                  <StatusIcon
                    className={cn("h-4 w-4 shrink-0", cfg.color, r.status === "running" && "animate-pulse")}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.targetCloud}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {INPUT_METHOD_LABELS[r.inputMethod] ?? r.inputMethod}
                      {r.scoringResult?.totalServices ? ` · ${r.scoringResult.totalServices} services` : ""}
                    </p>
                  </div>

                  {r.scoringResult ? (
                    <span className={cn("shrink-0 rounded-md px-2.5 py-1 text-sm font-semibold", scoreBg(r.scoringResult.score), scoreColor(r.scoringResult.score))}>
                      {r.scoringResult.score}%
                    </span>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">{cfg.label}</Badge>
                  )}

                  <span className="shrink-0 text-sm text-muted-foreground" suppressHydrationWarning>
                    {timeAgo(r.createdAt)}
                  </span>

                  {r.status === "complete" && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/lens/reports/${r.id}`}>
                        View <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
