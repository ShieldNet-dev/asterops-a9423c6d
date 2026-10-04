import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  ShieldCheck,
  PhoneCall,
  ScrollText,
  Bell,
  History,
  Wrench,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const PRIMARY = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/servers", label: "Fleet", icon: Server },
  { to: "/security", label: "Security posture", icon: ShieldCheck },
  { to: "/provisioning", label: "Provisioning", icon: Wrench },
  { to: "/calls", label: "Calls", icon: PhoneCall },
];

const SECONDARY = [
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/alert-log", label: "Alert log", icon: History },
  { to: "/audit", label: "Audit", icon: ScrollText },
  { to: "/agents", label: "Agents", icon: Server },
];

function NavItems({ items }: { items: typeof PRIMARY }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton asChild isActive={active} tooltip={collapsed ? item.label : undefined}>
              <NavLink to={item.to} className="flex items-center gap-2">
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn("flex items-center gap-2 px-1 py-1", collapsed && "justify-center px-0")}>
          <Brand size={collapsed ? "sm" : "md"} variant="chip" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operate</SidebarGroupLabel>
          <SidebarGroupContent><NavItems items={PRIMARY} /></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Observe</SidebarGroupLabel>
          <SidebarGroupContent><NavItems items={SECONDARY} /></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className={cn("flex items-center gap-2 px-1 py-1", collapsed && "justify-center px-0")}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">AsterOps</div>
              <div className="text-[10px] text-muted-foreground">v0.1 · open source</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function Topbar() {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const crumbs = pathname.split("/").filter(Boolean);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>AsterOps</span>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            <span className={cn(i === crumbs.length - 1 && "text-foreground font-medium capitalize")}>{c}</span>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="hidden md:inline-flex text-[10px] font-mono">
          <span className="mr-1.5 size-1.5 rounded-full bg-status-ok" /> Control plane online
        </Badge>
        <ThemeToggle />
        <div className="hidden md:block text-xs text-muted-foreground max-w-[160px] truncate">
          {user?.email}
        </div>
        <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}

export function AppShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}