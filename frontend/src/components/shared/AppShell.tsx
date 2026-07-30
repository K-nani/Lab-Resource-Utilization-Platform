
        
import * as React from "react";
import {
  LayoutDashboard,
  Microscope,
  CalendarDays,
  BarChart3,
  ClipboardList,
  LogOut,
  FlaskConical,
  Menu,
  Search,
  ListOrdered,
  ClipboardCheck,
  History,
  Building2,
  User,
  Wrench,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useRouter } from "@/store/router";
import { useAuthStore } from "@/store/authStore";
import { useAsync } from "@/hooks/use-async";
import { dashboardApi } from "@/lib/api/bookingApi";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import type { DashboardStats, Role } from "@/types";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  match: string[]; // path prefixes
  /** Optional numeric badge — shown when > 0. */
  badge?: number;
}

function navFor(role: Role): NavItem[] {
  const profileLink = { label: "Profile", to: "/profile", icon: User, match: ["/profile"] };
  switch (role) {
    case "RESEARCHER":
      return [
        { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, match: ["/dashboard"] },
        { label: "Equipment", to: "/equipment", icon: Microscope, match: ["/equipment"] },
        profileLink,
      ];
    case "LAB_MANAGER":
      return [
        { label: "Dashboard", to: "/manager/dashboard", icon: LayoutDashboard, match: ["/manager/dashboard"] },
        { label: "Equipment", to: "/manager/equipment", icon: Microscope, match: ["/manager/equipment", "/manager/equipment/new"] },
        { label: "Bookings", to: "/manager/bookings", icon: ClipboardList, match: ["/manager/bookings"] },
        { label: "Calendar", to: "/manager/calendar", icon: CalendarDays, match: ["/manager/calendar"] },
        { label: "Utilization", to: "/manager/utilization", icon: BarChart3, match: ["/manager/utilization"] },
        { label: "Utilization Dashboard", to: "/manager/utilization-dashboard", icon: BarChart3, match: ["/manager/utilization-dashboard"] },
        { label: "Waitlist", to: "/manager/waitlist", icon: ListOrdered, match: ["/manager/waitlist"] },
        // Calibrations Due badge count is injected by the AppShell component
        // (sourced from dashboardApi.stats().calibrationsDueIn30Days) — defaults to 0.
        { label: "Calibrations Due", to: "/manager/calibrations", icon: ClipboardCheck, match: ["/manager/calibrations"], badge: 0 },
        { label: "Audit Trail", to: "/manager/audit", icon: History, match: ["/manager/audit"] },
        { label: "Maintenance", to: "/manager/maintenance", icon: Wrench, match: ["/manager/maintenance", "/manager/maintenance/new"] },
        { label: "Reports", to: "/manager/reports", icon: FileText, match: ["/manager/reports"] },
        profileLink,
      ];
    case "LAB_TECHNICIAN":
      return [
        { label: "Calibration Dashboard", to: "/technician/calibration", icon: Wrench, match: ["/technician/calibration"] },
        { label: "My Maintenance Tasks", to: "/technician/maintenance", icon: Wrench, match: ["/technician/maintenance"] },
        { label: "Equipment", to: "/equipment", icon: Microscope, match: ["/equipment"] },
        profileLink,
      ];
    case "SYSTEM_ADMIN":
    case "INSTITUTION_ADMIN":
      return [
        { label: "Institutions", to: "/admin/institutions", icon: Building2, match: ["/admin/institutions"] },
        { label: "Calibration Dashboard", to: "/technician/calibration", icon: Wrench, match: ["/technician/calibration"] },
        { label: "Manage Equipment", to: "/manager/equipment", icon: Microscope, match: ["/manager/equipment", "/manager/equipment/new"] },
        { label: "Browse", to: "/browse", icon: Search, match: ["/browse"] },
        { label: "Equipment", to: "/equipment", icon: Microscope, match: ["/equipment"] },
        { label: "Utilization Dashboard", to: "/manager/utilization-dashboard", icon: BarChart3, match: ["/manager/utilization-dashboard"] },
        { label: "Reports", to: "/manager/reports", icon: FileText, match: ["/manager/reports"] },
        profileLink,
      ];
    case "DEPARTMENT_HEAD":
      return [
        { label: "Browse", to: "/browse", icon: Search, match: ["/browse"] },
        { label: "Calibration Dashboard", to: "/technician/calibration", icon: Wrench, match: ["/technician/calibration"] },
        { label: "Equipment", to: "/equipment", icon: Microscope, match: ["/equipment"] },
        { label: "Utilization Dashboard", to: "/manager/utilization-dashboard", icon: BarChart3, match: ["/manager/utilization-dashboard"] },
        profileLink,
      ];
    default:
      return [
        { label: "Browse", to: "/browse", icon: Search, match: ["/browse"] },
        { label: "Equipment", to: "/equipment", icon: Microscope, match: ["/equipment"] },
        profileLink,
      ];
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { path, navigate } = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const role = user?.role ?? "RESEARCHER";

  // Fetch dashboard stats ONLY for LAB_MANAGER (needed for the Calibrations
  // Due badge count). Non-managers resolve `null` and skip the fetch entirely
  // — the useAsync fn returns null synchronously without firing a request.
  const statsAsync = useAsync<DashboardStats | null>(
    () =>
      role === "LAB_MANAGER"
        ? dashboardApi.stats()
        : Promise.resolve(null),
    [role],
  );
  const calibrationsDueCount =
    role === "LAB_MANAGER"
      ? statsAsync.data?.calibrationsDueIn30Days ?? 0
      : 0;

  // Inject the live calibrations-due count into the matching nav item.
  const baseItems = navFor(role);
  const items: NavItem[] =
    role === "LAB_MANAGER"
      ? baseItems.map((it) =>
          it.to === "/manager/calibrations"
            ? { ...it, badge: calibrationsDueCount }
            : it,
        )
      : baseItems;

  const perm = ROLE_PERMISSIONS[role];

  const isActive = (it: NavItem) =>
    it.match.some((m) => path === m || path.startsWith(m + "/")) ||
    path === it.to;

  const initials = (user?.username || user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <FlaskConical className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight">LabFlow</p>
          <p className="text-[11px] text-muted-foreground">Equipment Booking</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isActive(it);
          const showBadge = typeof it.badge === "number" && it.badge > 0;
          return (
            <button
              key={it.to}
              onClick={() => {
                navigate(it.to);
                setMobileOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-[18px]" />
              <span className="flex-1 text-left">{it.label}</span>
              {showBadge && (
                <Badge
                  variant={active ? "secondary" : "default"}
                  className={cn(
                    "h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300",
                  )}
                >
                  {it.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9 rounded-xl">
              <AvatarFallback className="rounded-xl bg-primary/15 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.username}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {perm.label}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const bottomItems = items.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 glass lg:block">
        {SidebarInner}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/60 glass px-3 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            {SidebarInner}
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="size-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">LabFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg" aria-label="Account">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-semibold">{user?.username}</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-rose-600 focus:text-rose-600"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="sticky top-0 z-20 hidden h-14 items-center justify-end gap-2 border-b border-border/60 glass lg:flex lg:pl-64 pr-4">
        <ThemeToggle />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 rounded-lg px-2">
              <Avatar className="size-7 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-semibold">{user?.username}</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {user?.email}
              </span>
              <span className="mt-1 text-[11px] font-normal text-muted-foreground">
                {perm.label} · {user?.department?.name ?? "—"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-600 focus:text-rose-600"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:py-8 lg:pb-12">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border/60 glass-strong lg:hidden pb-[env(safe-area-inset-bottom)]">
        {bottomItems.map((it) => {
          const Icon = it.icon;
          const active = isActive(it);
          return (
            <button
              key={it.to}
              onClick={() => navigate(it.to)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {it.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
