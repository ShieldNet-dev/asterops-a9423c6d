import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { LayoutDashboard, Server, PhoneCall, LogOut, FileClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/servers", label: "Servers", icon: Server },
    { to: "/calls", label: "Call audit", icon: PhoneCall },
    { to: "/audit", label: "Audit log", icon: FileClock },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/dashboard"><Brand size="md" /></Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface text-foreground"
                    : "text-muted-foreground hover:bg-surface/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-3 py-2 text-xs text-muted-foreground">
            <div className="truncate text-foreground">{user?.email}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          >
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="md:pl-60">
        <header className="flex h-16 items-center justify-between border-b border-border px-6 md:px-8">
          <div className="md:hidden"><Brand size="sm" /></div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-status-ok" />
            Control plane operational
          </div>
        </header>
        <main className="px-6 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}