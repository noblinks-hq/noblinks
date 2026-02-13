"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export function StatWidget({
  title,
  value,
  trend,
  trendLabel,
}: {
  title: string;
  value: string | number;
  trend: "up" | "down";
  trendLabel: string;
}) {
  return (
    <div className="rounded-lg border p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-sm">
        {trend === "up" ? (
          <TrendingUp className="h-4 w-4 text-red-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-green-500" />
        )}
        <span
          className={trend === "up" ? "text-red-500" : "text-green-500"}
        >
          {trendLabel}
        </span>
      </div>
    </div>
  );
}
