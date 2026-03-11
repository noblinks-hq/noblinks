"use client";

import { type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useHeaderSlot } from "@/context/header-slot-context";

export function PageHeader({
  title,
  icon: Icon,
  actions,
}: {
  title: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
}) {
  const slot = useHeaderSlot();
  if (!slot) return null;
  return createPortal(
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>,
    slot,
  );
}
