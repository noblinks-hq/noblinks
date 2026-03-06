"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { WidgetChart } from "@/components/product/widget-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Dashboard, DbWidget } from "@/lib/types";
import type { SlideshowConfig } from "./slideshow-config-modal";

const categoryColors: Record<string, string> = {
  infrastructure: "from-blue-500/30 to-blue-500/5",
  docker: "from-cyan-500/30 to-cyan-500/5",
  kubernetes: "from-purple-500/30 to-purple-500/5",
  custom: "from-amber-500/30 to-amber-500/5",
};

const categoryBorderColors: Record<string, string> = {
  infrastructure: "border-blue-500/30",
  docker: "border-cyan-500/30",
  kubernetes: "border-purple-500/30",
  custom: "border-amber-500/30",
};

export function SlideshowView({
  dashboards,
  config,
  onExit,
}: {
  dashboards: Dashboard[];
  config: SlideshowConfig;
  onExit: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [widgetsByDashboard, setWidgetsByDashboard] = useState<Record<string, DbWidget[]>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const selected = dashboards.filter((d) =>
    config.dashboardIds.includes(d.id)
  );

  const current = selected[currentIndex];

  // Fetch widgets for all selected dashboards
  useEffect(() => {
    Promise.all(
      selected.map((d) =>
        fetch(`/api/dashboards/${d.id}/widgets`)
          .then((r) => (r.ok ? r.json() : { widgets: [] }))
          .then((data: { widgets: DbWidget[] }) => [d.id, data.widgets] as const)
      )
    ).then((entries) => {
      setWidgetsByDashboard(Object.fromEntries(entries));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.dashboardIds.join(",")]);

  const advanceSlide = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % selected.length);
      setFading(false);
    }, 400);
  }, [selected.length]);

  // Auto-advance timer
  useEffect(() => {
    if (selected.length <= 1) return;
    timerRef.current = setTimeout(
      advanceSlide,
      config.durationSeconds * 1000
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, config.durationSeconds, advanceSlide, selected.length]);

  // Enter fullscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.requestFullscreen?.().catch(() => {
      // Fullscreen may be blocked; continue in non-fullscreen
    });

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  // ESC key and fullscreen exit handling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onExit();
      }
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        onExit();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [onExit]);

  // Prevent scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!current) return null;

  const gradient = categoryColors[current.category] ?? categoryColors.custom;
  const borderColor = categoryBorderColors[current.category] ?? categoryBorderColors.custom;
  const currentWidgets = widgetsByDashboard[current.id] ?? [];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-background"
    >
      {/* Exit button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-[101] h-10 w-10 rounded-full bg-background/80 backdrop-blur"
        onClick={onExit}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Progress indicator */}
      {selected.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-[101] flex -translate-x-1/2 gap-2">
          {selected.map((_, i) => (
            <div
              key={selected[i]!.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Dashboard slide */}
      <div
        className={`flex h-full w-full flex-col transition-opacity duration-400 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Header bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
        <div className="flex items-center gap-4 border-b px-10 py-5">
          <h1 className="text-2xl font-bold">{current.name}</h1>
          <Badge variant="secondary" className="text-sm">{current.environment}</Badge>
          <Badge variant="outline" className="text-sm">{current.category}</Badge>
          {selected.length > 1 && (
            <span className="ml-auto text-sm text-muted-foreground">
              {currentIndex + 1} / {selected.length}
            </span>
          )}
        </div>

        {/* Widgets grid */}
        <div className="flex-1 overflow-auto px-10 py-8">
          {currentWidgets.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-lg text-muted-foreground">
                No widgets in this dashboard yet.
              </p>
            </div>
          ) : (
            <div className="grid h-full auto-rows-fr grid-cols-2 gap-6 lg:grid-cols-3">
              {currentWidgets.map((w) => (
                <div
                  key={w.id}
                  className={`flex flex-col rounded-xl border-2 ${borderColor} bg-muted/20 p-6`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold leading-tight">{w.title}</h2>
                    <Badge variant="secondary" className="shrink-0 text-xs">{w.type}</Badge>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Machine: <span className="font-medium text-foreground">{w.machine}</span>
                  </p>
                  <div className="flex-1">
                    <WidgetChart widget={w} dashboardId={current.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
