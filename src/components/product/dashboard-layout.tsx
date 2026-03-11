"use client";

import type { ReactNode } from "react";
import { NoblinksProvider } from "@/context/noblinks-context";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <NoblinksProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar — mobile spacing only */}
          <header className="flex h-14 items-center border-b pl-14 md:pl-6" />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </NoblinksProvider>
  );
}
