import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/brand";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      const message = formatAuthError(error.message);
      setAuthError(message);
      toast.error(message);
      return;
    }
    navigate("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-10 flex justify-center">
          <Brand size="lg" />
        </Link>
        <div className="rounded-xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your AsterOps control plane.
          </p>
          {authError && (
            <Alert variant="destructive" className="mt-5">
              <AlertCircle className="size-4" />
              <AlertTitle>Sign in unavailable</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/signup" className="text-brand hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function formatAuthError(message: string) {
  if (/failed to fetch|network|fetch/i.test(message)) {
    return "Authentication service is unreachable. The Supabase project configured for AsterOps is not responding, so sign in cannot complete until the backend is resumed or replaced with an active Supabase project.";
  }
  return message;
}

export default LoginPage;
