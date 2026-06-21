import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import Alerts from "@/pages/Alerts";
import AlertLog from "@/pages/AlertLog";
import Audit from "@/pages/Audit";
import Calls from "@/pages/Calls";
import ServersIndex from "@/pages/ServersIndex";
import ServerDetail from "@/pages/ServerDetail";
import NotFound from "@/pages/NotFound";
import Security from "@/pages/Security";
import Provisioning from "@/pages/Provisioning";
import { AppShell } from "@/components/app-shell";

const queryClient = new QueryClient();

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<Protected><AppShell /></Protected>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/servers" element={<ServersIndex />} />
              <Route path="/servers/:id" element={<ServerDetail />} />
              <Route path="/security" element={<Security />} />
              <Route path="/provisioning" element={<Provisioning />} />
              <Route path="/calls" element={<Calls />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/alert-log" element={<AlertLog />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/agents" element={<Agents />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster richColors position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}