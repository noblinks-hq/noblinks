"use client";

import { useState, type ReactNode } from "react";
import { HeaderSlotContext } from "@/context/header-slot-context";
import { NoblinksProvider } from "@/context/noblinks-context";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);

  return (
    <HeaderSlotContext.Provider value={slot}>
      <NoblinksProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top bar — portal target for page titles and actions */}
            <header className="flex h-14 items-center border-b">
              <div
                ref={setSlot}
                className="flex flex-1 items-center justify-between pl-14 pr-6 md:pl-6"
              />
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </NoblinksProvider>
    </HeaderSlotContext.Provider>
  );
}
