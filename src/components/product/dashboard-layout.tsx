"use client";

import type { ReactNode } from "react";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { NoblinksProvider } from "@/context/noblinks-context";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <NoblinksProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-14 items-center justify-end gap-4 border-b px-6">
            <UserProfile />
            <ModeToggle />
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </NoblinksProvider>
  );
}
