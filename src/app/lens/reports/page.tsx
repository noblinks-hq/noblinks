"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, Plus, CheckCircle2, XCircle, Clock, ArrowRight, Loader2, ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/product/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatchResult {
  match: "compatible" | "partial" | "none";
}

interface Report {
  id: string;
  targetCloud: string;
  inputMethod: string;
  status: "pending" | "running" | "complete" | "failed";
  scoringResult: { score: number; totalServices: number } | null;
  matchResults: MatchResult[] | null;
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

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function groupByDay(reports: Report[]): { label: string; reports: Report[] }[] {
  const groups: Map<string, Report[]> = new Map();
  for (const r of reports) {
    const label = dayLabel(r.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(r);
  }
  return Array.from(groups.entries()).map(([label, reports]) => ({ label, reports }));
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
  if (score >= 50) return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30";
  return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
}

const STATUS_CONFIG = {
  complete: { icon: CheckCircle2, color: "text-green-500", label: "Complete" },
  running:  { icon: Clock,        color: "text-blue-500 animate-pulse", label: "Running" },
  pending:  { icon: Clock,        color: "text-muted-foreground", label: "Pending" },
  failed:   { icon: XCircle,      color: "text-destructive", label: "Failed" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/lens/reports")
      .then((r) => r.json())
      .then((data: Report[]) => {
        setReports(data);
        const labels = new Set(data.map((r) => dayLabel(r.createdAt)));
        setCollapsed(labels);
      })
      .finally(() => setLoading(false));
  }, []);

  const groups = groupByDay(reports);

  function toggleGroup(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-4">
      <PageHeader
        title="Reports"
        icon={FileText}
        actions={
          <Button size="sm" asChild>
            <Link href="/lens/analyze">
              <Plus className="mr-2 h-4 w-4" />
              New Analysis
            </Link>
          </Button>
        }
      />

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center rounded-xl border bg-card">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No reports yet</p>
            <p className="text-sm text-muted-foreground mt-1">Run your first analysis to see results here.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/lens/analyze">Start analysis</Link>
          </Button>
        </div>
      )}

      {!loading && groups.map(({ label, reports: groupReports }) => {
        const isCollapsed = collapsed.has(label);
        return (
        <div key={label} className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleGroup(label)}
            className="w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-muted-foreground">{groupReports.length} {groupReports.length === 1 ? "report" : "reports"}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isCollapsed && "rotate-180")} />
          </button>
          {!isCollapsed && <div className="divide-y border-t">
            {groupReports.map((report) => {
              const cfg = STATUS_CONFIG[report.status];
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={report.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
                >
                  <StatusIcon className={cn("h-4 w-4 shrink-0", cfg.color)} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">AWS</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="font-medium text-sm">{report.targetCloud}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
                      {timeAgo(report.createdAt)}
                    </p>
                  </div>

                  {report.status === "complete" && report.scoringResult && (
                    <span className={cn("shrink-0 rounded-md px-2.5 py-1 text-sm font-semibold", scoreColor(report.scoringResult.score))}>
                      {report.scoringResult.score}%
                    </span>
                  )}

                  {report.status !== "complete" && (
                    <Badge variant="secondary" className="shrink-0 text-xs">{cfg.label}</Badge>
                  )}

                  {report.status === "complete" && (
                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                      <Link href={`/lens/reports/${report.id}`}>
                        View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>}
        </div>
      );
      })}
    </div>
  );
}
