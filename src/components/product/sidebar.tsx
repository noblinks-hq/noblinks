"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  Server,
  AlertTriangle,
  Bot,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
} from "lucide-react";
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
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboards", label: "Dashboards", icon: LayoutGrid },
  { href: "/machines", label: "Machines", icon: Server },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/overview" && pathname.startsWith(href));
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
        {!session && (
          <DropdownMenuItem asChild>
            <Link href="/login">Sign in</Link>
          </DropdownMenuItem>
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

function BottomBar({ settingsActive, onSettingsClick }: { settingsActive: boolean; onSettingsClick?: () => void }) {
  return (
    <div className="border-t flex">
      <Link
        href="/settings"
        {...(onSettingsClick ? { onClick: onSettingsClick } : {})}
        className={cn(
          "flex-1 flex items-center justify-center py-3 transition-colors rounded-none",
          settingsActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </Link>
      <div className="flex-1 flex items-center justify-center py-3">
        <SidebarUserButton />
      </div>
      <div className="flex-1 flex items-center justify-center py-3">
        <ThemeToggle />
      </div>
    </div>
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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const settingsActive = isActive(pathname, "/settings");

  return (
    <>
      {/* ── Mobile hamburger (outside sidebar) ── */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar (fixed overlay, always w-56) ── */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-56 flex flex-col border-r bg-background transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
          <Link
            href="/overview"
            className="flex items-center gap-2 font-semibold text-primary"
            onClick={() => setMobileOpen(false)}
          >
            <Bot className="h-5 w-5" />
            <span>Noblinks</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 p-2 flex-1" aria-label="Product navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              collapsed={false}
              active={isActive(pathname, item.href)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        <BottomBar settingsActive={settingsActive} onSettingsClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop burger when collapsed (floats over content) ── */}
      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex fixed top-3 left-3 z-50"
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* ── Desktop sidebar (static, collapsible) ── */}
      <aside
        style={{ width: collapsed ? "0" : "10rem" }}
        className="hidden md:flex flex-col h-full border-r bg-background transition-[width] duration-200 overflow-hidden shrink-0"
      >
        <div className="flex h-14 items-center border-b px-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Collapse sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {!collapsed && (
            <Link
              href="/overview"
              className="flex items-center gap-2 font-semibold text-primary ml-2 whitespace-nowrap"
            >
              <Bot className="h-5 w-5 shrink-0" />
              <span>Noblinks</span>
            </Link>
          )}
        </div>

        {!collapsed && (
          <>
            <nav className="flex flex-col gap-1 p-2 flex-1" aria-label="Product navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  collapsed={false}
                  active={isActive(pathname, item.href)}
                />
              ))}
            </nav>

            <BottomBar settingsActive={settingsActive} />
          </>
        )}
      </aside>
    </>
  );
}
