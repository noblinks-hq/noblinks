import Link from "next/link";
import { Activity } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ui/mode-toggle";

export function SiteHeader() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm" role="banner">
        <nav
          className="container mx-auto px-6 h-16 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            aria-label="Noblinks - Go to homepage"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-700 text-white">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">Noblinks</span>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-3">
            <UserProfile />
            <Link href="/register" className="hidden sm:inline-flex">
              <Button size="sm">Get started</Button>
            </Link>
            <ModeToggle />
          </div>
        </nav>
      </header>
    </>
  );
}
