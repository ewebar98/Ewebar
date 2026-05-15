import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/services/api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Intellipath" }] }),
  component: Register,
});

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser(form.name, form.email, form.password);
      toast.success("Account created — welcome!");
      navigate({ to: "/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-5"
        >
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Intellipath</span>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Get personalized recommendations in minutes.</p>
          </div>
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={form.name} onChange={upd("name")} placeholder="Ada Eze" required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={upd("email")} placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={upd("password")} placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already a member? <Link to="/login" className="font-medium text-primary">Sign in</Link>
          </p>
        </motion.form>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative flex h-full items-center justify-center p-12 text-primary-foreground">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">Join 18,000+ students<br />finding their path.</h2>
            <p className="mt-3 max-w-sm text-primary-foreground/80">Smart matching, scholarship alerts, and a 24/7 AI mentor. Free, always.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
