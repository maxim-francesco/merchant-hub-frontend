import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ro } from "@/lib/i18n/ro";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Settings,
  Menu,
  Moon,
  Sun,
  Search,
  Bell,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/products", labelKey: "products", icon: Package },
  { to: "/categories", labelKey: "categories", icon: Tags },
  { to: "/orders", labelKey: "orders", icon: ShoppingCart },
  { to: "/team", labelKey: "team", icon: Users },
  { to: "/settings", labelKey: "settings", icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(({ to, labelKey, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        const label = ro.nav[labelKey as keyof typeof ro.nav] ?? labelKey;
        return (
          <Link
            key={to}
            to={to}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { useTenantStore } from "@/lib/store/tenantStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";

function TenantSwitcher() {
  const queryClient = useQueryClient();
  const activeAdminTenant = useTenantStore((s) => s.activeAdminTenant);
  const setActiveAdminTenant = useTenantStore((s) => s.setActiveAdminTenant);

  const { data: tenants, isLoading, isSuccess } = useQuery({
    queryKey: ["my-tenants"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me/tenants");
      return data.data.tenants;
    },
  });

  // Automatically default active admin tenant or hard reset if phantom user/stale DB state
  useEffect(() => {
    if (isSuccess && Array.isArray(tenants)) {
      if (tenants.length === 0) {
        // Phantom user or stale DB seed state — force logout
        localStorage.removeItem("auth_token");
        localStorage.removeItem("tenant-store");
        window.location.href = "/login";
      } else {
        const exists = tenants.some((t: any) => t.id === activeAdminTenant?.id);
        if (!activeAdminTenant || !exists) {
          setActiveAdminTenant(tenants[0]);
        }
      }
    }
  }, [isSuccess, tenants, activeAdminTenant, setActiveAdminTenant]);

  const handleSwitch = (tenant: any) => {
    setActiveAdminTenant(tenant);
    // Invalidate everything to refresh active view with new context
    queryClient.invalidateQueries();
  };

  const currentName = activeAdminTenant?.name || ro.common.selectTenant;
  const currentSlug = activeAdminTenant?.slug || ro.common.noTenantSelected;

  return (
    <div className="border-b px-4 py-3 flex items-center justify-between bg-card">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between gap-2 px-2 hover:bg-accent/50 focus-visible:ring-0 active:scale-[0.98] transition-all duration-150"
          >
            <div className="flex items-center gap-2.5 text-left min-w-0">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-stone-900 text-white dark:bg-white dark:text-stone-950">
                <Store className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="text-xs font-semibold text-foreground leading-none truncate">
                  {currentName}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                  {currentSlug}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 mt-1 font-sans">
          <DropdownMenuLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase px-2.5 py-1.5">
            {ro.common.workspaces}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading ? (
            <div className="px-2.5 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> {ro.common.loadingWorkspaces}
            </div>
          ) : tenants && tenants.length > 0 ? (
            tenants.map((t: any) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => handleSwitch(t)}
                className="flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{t.name}</span>
                  <span className="text-[9px] text-muted-foreground truncate">{t.slug}</span>
                </div>
                {activeAdminTenant?.id === t.id && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2.5 py-2 text-xs text-muted-foreground">
              {ro.common.noWorkspaces}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-card">
        <TenantSwitcher />
        <NavLinks />
        <div className="mt-auto p-3 border-t text-xs text-muted-foreground">
          <div>{ro.common.planGrowth}</div>
          <div className="mt-0.5">v1.4.2</div>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 backdrop-blur px-3 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <TenantSwitcher />
              <NavLinks onClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder={ro.common.searchPlaceholder}
                className="w-full h-9 rounded-md border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <div className="flex-1 md:hidden" />

          <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            AM
          </div>
        </header>

        <main className="p-3 sm:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
