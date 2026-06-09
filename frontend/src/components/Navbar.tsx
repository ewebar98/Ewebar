import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GraduationCap, Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/recommendations", label: "Recommendations" },
  // { to: "/scholarships", label: "Scholarships" },
  { to: "/assistant", label: "Assistant" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow ring-2 ring-primary/20">
            <GraduationCap className="h-[22px] w-[22px] text-primary-foreground" strokeWidth={2} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">WeBAR</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${path === l.to ? "text-primary" : "text-muted-foreground"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button onClick={toggle} aria-label="Toggle theme" className="rounded-lg p-2 hover:bg-accent">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all bg-gradient-primary text-primary-foreground h-9 px-4 shadow-elegant hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t md:hidden">
          <div className="space-y-1 px-4 py-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-accent">
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 text-xs font-semibold transition-colors text-center"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground h-9 text-xs font-semibold transition-all text-center shadow-soft"
              >
                Sign up
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
