"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
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
  const [paused, setPaused] = useState(false);
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

  const goTo = useCallback((index: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setFading(false);
    }, 300);
  }, []);

  const advanceSlide = useCallback(() => {
    goTo((currentIndex + 1) % selected.length);
  }, [currentIndex, goTo, selected.length]);

  const prevSlide = useCallback(() => {
    goTo((currentIndex - 1 + selected.length) % selected.length);
  }, [currentIndex, goTo, selected.length]);

  // Auto-advance timer (respects paused state)
  useEffect(() => {
    if (selected.length <= 1 || paused) return;
    timerRef.current = setTimeout(advanceSlide, config.durationSeconds * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, config.durationSeconds, advanceSlide, selected.length, paused]);

  // Enter fullscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onExit();
      } else if (e.key === " ") {
        e.preventDefault();
        setPaused((v) => !v);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        advanceSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
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
  }, [onExit, advanceSlide, prevSlide]);

  // Prevent scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!current) return null;

  const gradient = categoryColors[current.category] ?? categoryColors.custom;
  const borderColor = categoryBorderColors[current.category] ?? categoryBorderColors.custom;
  const currentWidgets = widgetsByDashboard[current.id] ?? [];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top controls */}
      <div className="absolute top-4 right-4 z-[101] flex items-center gap-2">
        {selected.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-background/80 backdrop-blur"
              onClick={prevSlide}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-background/80 backdrop-blur"
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? "Play" : "Pause"}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-background/80 backdrop-blur"
              onClick={advanceSlide}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-background/80 backdrop-blur"
          onClick={onExit}
          aria-label="Exit"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress indicator */}
      {selected.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-[101] flex -translate-x-1/2 items-center gap-2">
          {selected.map((_, i) => (
            <button
              key={selected[i]!.id}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
          {paused && (
            <span className="ml-2 rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur">
              Paused
            </span>
          )}
        </div>
      )}

      {/* Dashboard slide */}
      <div
        className={`flex h-full w-full flex-col transition-opacity duration-300 ${
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
        <div className="flex-1 overflow-auto px-6 py-6 md:px-10 md:py-8">
          {currentWidgets.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-lg text-muted-foreground">No widgets in this dashboard yet.</p>
            </div>
          ) : (
            <div className="grid h-full auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {currentWidgets.map((w) => (
                <div
                  key={w.id}
                  className={`flex flex-col rounded-xl border-2 ${borderColor} bg-muted/20 p-4 md:p-6`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold leading-tight md:text-lg">{w.title}</h2>
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
