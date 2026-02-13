"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Dashboard } from "@/lib/types";
import type { SlideshowConfig } from "./slideshow-config-modal";

const categoryColors: Record<string, string> = {
  infrastructure: "from-blue-500/30 to-blue-500/5",
  docker: "from-cyan-500/30 to-cyan-500/5",
  kubernetes: "from-purple-500/30 to-purple-500/5",
  custom: "from-amber-500/30 to-amber-500/5",
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
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const selected = dashboards.filter((d) =>
    config.dashboardIds.includes(d.id)
  );

  const current = selected[currentIndex];

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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
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
        className={`flex h-full w-full flex-col items-center justify-center transition-opacity duration-400 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-full max-w-4xl space-y-8 px-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            <Badge variant="outline" className="text-sm">
              {current.category}
            </Badge>
            <h1 className="text-4xl font-bold">{current.name}</h1>
            <p className="text-lg text-muted-foreground">
              {current.environment}
            </p>
          </div>

          {/* Placeholder visualization area */}
          <div
            className={`h-64 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center border`}
          >
            <p className="text-muted-foreground">
              {current.visualizationCount} visualizations
            </p>
          </div>

          {/* Counter */}
          {selected.length > 1 && (
            <p className="text-center text-sm text-muted-foreground">
              {currentIndex + 1} of {selected.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
