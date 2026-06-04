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
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/agents" element={<Protected><Agents /></Protected>} />
            <Route path="/alerts" element={<Protected><Alerts /></Protected>} />
            <Route path="/alert-log" element={<Protected><AlertLog /></Protected>} />
            <Route path="/audit" element={<Protected><Audit /></Protected>} />
            <Route path="/calls" element={<Protected><Calls /></Protected>} />
            <Route path="/servers" element={<Protected><ServersIndex /></Protected>} />
            <Route path="/servers/:id" element={<Protected><ServerDetail /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster richColors position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}