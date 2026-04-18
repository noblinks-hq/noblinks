"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ScanSearch,
  Plus,
  FileText,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { BillingButton } from "@/components/product/billing-button";
import { CheckoutButton } from "@/components/product/checkout-button";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/lens", label: "Overview", icon: ScanSearch },
  { href: "/lens/analyze", label: "New Analysis", icon: Plus },
  { href: "/lens/reports", label: "Reports", icon: FileText },
];

function isActive(pathname: string, href: string) {
  if (href === "/lens") return pathname === "/lens";
  return pathname.startsWith(href);
}

function SidebarUserButton() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="User menu">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {session && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Your Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle() {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  collapsed: boolean;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      {...(onClick ? { onClick } : {})}
      className={cn(
        "flex items-center rounded-md text-sm font-medium transition-colors",
        collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

const PLAN_LABELS: Record<string, string> = { none: "Free plan", starter: "Starter", growth: "Growth" };

const UPGRADE_CONTENT: Record<string, { title: string; perks: string[]; slug: string } | null> = {
  none: {
    title: "Upgrade to Starter — €49/mo",
    perks: ["5 analyses per month", "Terraform & Helm upload", "AI executive summary", "PDF export"],
    slug: "lens-starter",
  },
  starter: {
    title: "Upgrade to Growth — €149/mo",
    perks: ["20 analyses per month", "All 6 sovereign clouds", "Multi-cloud comparison", "Drift detection & alerts"],
    slug: "lens-growth",
  },
  growth: null,
};

function PlanBadge({ collapsed }: { collapsed?: boolean }) {
  const [data, setData] = useState<{ plan: string; used: number; limit: number } | null>(null);

  useEffect(() => {
    fetch("/api/lens/plan").then((r) => r.json()).then((d) => setData(d as typeof data));
  }, []);

  if (!data) return null;

  const isPaid = data.plan !== "none";
  const label = PLAN_LABELS[data.plan] ?? data.plan;
  const upgrade = UPGRADE_CONTENT[data.plan];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 text-xs font-medium transition-colors rounded-md border",
            !isPaid
              ? "border-amber-400/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10",
            collapsed ? "w-10 h-10 justify-center" : "px-3 py-1.5 w-full"
          )}
          title={collapsed ? label : undefined}
        >
          <Zap className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-64 p-0 overflow-hidden">
        {/* Usage bar */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-4 border-b">
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.used} of {data.limit} {data.limit === 1 ? "analysis" : "analyses"} used this month
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", data.used >= data.limit ? "bg-destructive" : "bg-primary")}
              style={{ width: `${Math.min(100, (data.used / data.limit) * 100)}%` }}
            />
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          {upgrade ? (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">{upgrade.title}</p>
                <ul className="space-y-1">
                  {upgrade.perks.map((p) => (
                    <li key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <CheckoutButton slug={upgrade.slug} label="Upgrade" className="w-full h-8 text-xs" />
            </>
          ) : (
            <BillingButton />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BottomBar({ collapsed, settingsActive, onSettingsClick }: { collapsed?: boolean; settingsActive: boolean; onSettingsClick?: () => void }) {
  return (
    <div className={cn("border-t", collapsed ? "flex flex-col items-center py-2 gap-1" : "flex")}>
      <Link
        href="/lens/settings"
        {...(onSettingsClick ? { onClick: onSettingsClick } : {})}
        className={cn(
          "flex items-center justify-center transition-colors rounded-none",
          collapsed ? "w-10 h-10" : "flex-1 py-3",
          settingsActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </Link>
      <div className={cn("flex items-center justify-center", collapsed ? "w-10 h-10" : "flex-1 py-3")}>
        <SidebarUserButton />
      </div>
      <div className={cn("flex items-center justify-center", collapsed ? "w-10 h-10" : "flex-1 py-3")}>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function LensSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const settingsActive = pathname.startsWith("/lens/settings");

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-56 flex flex-col border-r bg-background transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
          <Link href="/lens" className="flex items-center gap-2 font-semibold text-primary" onClick={() => setMobileOpen(false)}>
            <ScanSearch className="h-5 w-5" />
            <span>Lens</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} collapsed={false} active={isActive(pathname, item.href)} onClick={() => setMobileOpen(false)} />
          ))}
        </nav>
        <div className="px-2 pb-2">
          <PlanBadge collapsed={false} />
        </div>
        <BottomBar settingsActive={settingsActive} collapsed={false} onSettingsClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <div
        style={{ width: collapsed ? "3.5rem" : "10rem" }}
        className="relative hidden md:block transition-[width] duration-200 shrink-0"
      >
        <aside className="flex flex-col h-full w-full border-r bg-background overflow-hidden">
          <div className="flex h-14 items-center gap-2 border-b px-3 shrink-0">
            <Link href="/lens" className="flex items-center gap-1.5 font-semibold text-primary whitespace-nowrap">
              {!collapsed && <span>Lens</span>}
              <ScanSearch className="h-4 w-4 shrink-0" />
            </Link>
          </div>
          <nav className={cn("flex flex-col gap-1 p-2 flex-1", collapsed && "items-center")}>
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} collapsed={collapsed} active={isActive(pathname, item.href)} />
            ))}
          </nav>
          <div className={cn("px-2 pb-2", collapsed && "flex justify-center px-1")}>
            <PlanBadge collapsed={collapsed} />
          </div>
          <BottomBar settingsActive={settingsActive} collapsed={collapsed} />
        </aside>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute right-0 top-14 z-10 flex h-5 w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </>
  );
}
