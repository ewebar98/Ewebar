import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { redirect } from "@tanstack/react-router";

export type Role = "student" | "admin";
export type AuthUser = { id: string; name: string; email: string; role: Role };

const STORAGE_KEY = "Intellipath.auth";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<AuthUser>;
  logout: () => void;
};

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => { throw new Error("AuthProvider missing"); },
  logout: () => {},
});

function readStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readStored());
    setLoading(false);
  }, []);

  const login = async (email: string, _password: string, role: Role) => {
    await new Promise((r) => setTimeout(r, 350));
    const u: AuthUser = {
      id: role === "admin" ? "admin_1" : "u_1",
      email,
      name: role === "admin" ? "Admin User" : "Ada Eze",
      role,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

/**
 * Route guard for `beforeLoad`. Reads auth from localStorage (synchronous),
 * which works for SPA-style protection. Throws a redirect if access is denied.
 */
export function requireRole(role: Role | "any") {
  return () => {
    if (typeof window === "undefined") return; // skip during SSR/prerender
    const u = readStored();
    if (!u) throw redirect({ to: "/login" });
    if (role !== "any" && u.role !== role) {
      throw redirect({ to: u.role === "admin" ? "/admin" : "/dashboard" });
    }
  };
}
