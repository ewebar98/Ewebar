import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type Role } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Intellipath" }] }),
  component: Login,
});

/**
 * Mock access-control resolver. In production this is decided server-side
 * based on the user's record. Here we infer admin from the email pattern.
 */
function resolveRole(email: string): Role {
  const e = email.trim().toLowerCase();
  return e.startsWith("admin") || e.endsWith("@Intellipath.admin") ? "admin" : "student";
}

function Login() {
  const [email, setEmail] = useState("ada@example.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = resolveRole(email);
      const u = await login(email, password, role);
      toast.success(`Welcome, ${u.name}`);
      navigate({ to: u.role === "admin" ? "/admin" : "/dashboard" });
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">Intellipath</span>
          </Link>
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">Welcome back to your future.</h2>
            <p className="mt-3 text-primary-foreground/80">Pick up where you left off — your recommendations are waiting.</p>
          </div>
          <p className="text-xs text-primary-foreground/60">© Intellipath</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-5"
        >
          <div>
            <h1 className="font-display text-2xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Access is granted automatically by your account role.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Demo: any email signs in as <strong className="text-foreground">student</strong>.
              Emails starting with <code className="rounded bg-background px-1">admin</code> sign in as <strong className="text-foreground">admin</strong>.
            </span>
          </div>

          <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link to="/register" className="font-medium text-primary">Create an account</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
