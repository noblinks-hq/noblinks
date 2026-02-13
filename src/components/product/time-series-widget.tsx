"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Widget } from "@/lib/types";

export function TimeSeriesWidget({ widget }: { widget: Widget }) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 font-semibold">{widget.title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={widget.data}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="oklch(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {widget.thresholdValue !== undefined && (
              <ReferenceLine
                y={widget.thresholdValue}
                stroke="hsl(0 84% 60%)"
                strokeDasharray="6 4"
                label={{
                  value: `Threshold: ${widget.thresholdValue}`,
                  position: "insideTopRight",
                  fill: "hsl(0 84% 60%)",
                  fontSize: 11,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
