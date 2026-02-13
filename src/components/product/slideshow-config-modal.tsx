"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import type { Dashboard } from "@/lib/types";

export interface SlideshowConfig {
  dashboardIds: string[];
  durationSeconds: number;
}

export function SlideshowConfigModal({
  dashboards,
  onStart,
}: {
  dashboards: Dashboard[];
  onStart: (config: SlideshowConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState(5);

  function toggleDashboard(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === dashboards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(dashboards.map((d) => d.id)));
    }
  }

  function handleStart() {
    if (selectedIds.size === 0) return;
    onStart({
      dashboardIds: dashboards
        .filter((d) => selectedIds.has(d.id))
        .map((d) => d.id),
      durationSeconds: Math.max(1, duration),
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Play className="mr-2 h-4 w-4" />
          Slideshow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start Slideshow</DialogTitle>
          <DialogDescription>
            Select dashboards to rotate through in fullscreen mode.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Dashboards</Label>
            <div className="rounded-md border">
              <div className="flex items-center gap-3 border-b px-3 py-2">
                <Checkbox
                  checked={
                    selectedIds.size === dashboards.length &&
                    dashboards.length > 0
                  }
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">Select all</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {dashboards.map((d) => (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedIds.has(d.id)}
                      onCheckedChange={() => toggleDashboard(d.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.environment} &middot; {d.category}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slide-duration">
              Duration per slide (seconds)
            </Label>
            <Input
              id="slide-duration"
              type="number"
              min={1}
              max={300}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={handleStart} disabled={selectedIds.size === 0}>
            <Play className="mr-2 h-4 w-4" />
            Start ({selectedIds.size} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
