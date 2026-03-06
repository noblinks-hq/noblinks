"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Globe, GlobeLock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EditDashboardModal } from "@/components/product/edit-dashboard-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dashboard } from "@/lib/types";

const categoryColors: Record<string, string> = {
  infrastructure: "from-blue-500/20 to-blue-500/5",
  docker: "from-cyan-500/20 to-cyan-500/5",
  kubernetes: "from-purple-500/20 to-purple-500/5",
  custom: "from-amber-500/20 to-amber-500/5",
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardCard({
  dashboard,
  onUpdated,
}: {
  dashboard: Dashboard;
  onUpdated: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [publicToken, setPublicToken] = useState<string | null>(dashboard.publicToken ?? null);
  const gradient = categoryColors[dashboard.category] ?? categoryColors.custom;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://noblinks.com";

  async function handleShare() {
    setSharing(true);
    try {
      const r = await fetch(`/api/dashboards/${dashboard.id}/share`, { method: "POST" });
      const data = (await r.json()) as { token?: string };
      if (data.token) {
        setPublicToken(data.token);
        const url = `${appUrl}/share/${data.token}`;
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied to clipboard");
      }
    } catch {
      toast.error("Failed to create share link");
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyShareLink() {
    if (!publicToken) return;
    const url = `${appUrl}/share/${publicToken}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  }

  async function handleRevokeShare() {
    try {
      await fetch(`/api/dashboards/${dashboard.id}/share`, { method: "DELETE" });
      setPublicToken(null);
      toast.success("Share link revoked");
    } catch {
      toast.error("Failed to revoke share link");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/dashboards/${dashboard.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete dashboard");
      }
      toast.success("Dashboard deleted");
      setDeleteOpen(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="relative rounded-lg border transition-colors hover:bg-muted/50">
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {publicToken ? (
                <>
                  <DropdownMenuItem onClick={handleCopyShareLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Share Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRevokeShare}>
                    <GlobeLock className="mr-2 h-4 w-4" />
                    Revoke Sharing
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={handleShare} disabled={sharing}>
                  <Globe className="mr-2 h-4 w-4" />
                  {sharing ? "Creating link…" : "Share"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={`/dashboards/${dashboard.id}`} className="block">
          <div
            className={`h-24 rounded-t-lg bg-gradient-to-br ${gradient}`}
          />

          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{dashboard.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboard.environment}
                </p>
              </div>
              <Badge variant="outline">{dashboard.category}</Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{dashboard.visualizationCount} visualizations</span>
              <span>Updated {timeAgo(dashboard.updatedAt)}</span>
            </div>
          </div>
        </Link>
      </div>

      <EditDashboardModal
        dashboard={dashboard}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={onUpdated}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{dashboard.name}&rdquo;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
