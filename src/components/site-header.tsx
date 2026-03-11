import Link from "next/link";
import { Activity } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ui/mode-toggle";

const navLinks = [
  { label: "Product", href: "/overview" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "https://docs.noblinks.com" },
];

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

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <UserProfile />
            <Button size="sm" disabled className="hidden sm:inline-flex">Get started</Button>
            <ModeToggle />
          </div>
        </nav>
      </header>
    </>
  );
}
