import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Star, GraduationCap, Wallet, FileText, FolderOpen,
  Bell, Settings, Brain, Compass, User, Sun, Moon, LogOut, Menu, X, BarChart,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const studentNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/recommendations", icon: Star, label: "Recommendations" },
  { to: "/universities", icon: GraduationCap, label: "Universities" },
  { to: "/scholarships", icon: Wallet, label: "Scholarships" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
  { to: "/applications", icon: FileText, label: "Applications" },
  { to: "/career", icon: Compass, label: "Career" },
  { to: "/assistant", icon: Brain, label: "Assistant" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const adminNav = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview" },
  { to: "/admin/universities", icon: GraduationCap, label: "Universities" },
  { to: "/admin/courses", icon: FileText, label: "Courses" },
  { to: "/admin/scholarships", icon: Wallet, label: "Scholarships" },
  { to: "/admin/analytics", icon: BarChart, label: "Analytics" },
];

export function AppLayout({ variant = "student", children }: { variant?: "student" | "admin"; children?: ReactNode }) {
  const nav = variant === "admin" ? adminNav : studentNav;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };
  const initials = (user?.name ?? "AE").split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-sidebar transition-transform md:static md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Intellipath</span>
          </Link>
          <button className="md:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1 p-3">
          {variant === "admin" && (
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</div>
          )}
          {nav.map((item) => {
            const active = path === item.to || (item.to !== "/admin" && item.to !== "/dashboard" && path.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-6 border-t pt-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-8">
          <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="hidden font-display text-base font-semibold capitalize md:block">
            {nav.find((n) => n.to === path)?.label ?? (variant === "admin" ? "Admin" : "Welcome")}
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={toggle} aria-label="Theme" className="rounded-lg p-2 hover:bg-accent">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-accent">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Link>
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </Link>
          </div>
        </header>

        <motion.main
          key={path}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-4 md:p-8"
        >
          {children ?? <Outlet />}
        </motion.main>
      </div>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}
    </div>
  );
}
