import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { redirect } from "@tanstack/react-router";
import { loginUser, registerUser } from "@/services/api";

export type Role = "student" | "admin";
export type AuthUser = { id: string; name: string; email: string; role: Role };

const STORAGE_KEY = "WeBAR.auth";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role?: Role) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => { throw new Error("AuthProvider missing"); },
  register: async () => { throw new Error("AuthProvider missing"); },
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

  const login = async (email: string, password: string, _role?: Role) => {
    const res = await loginUser(email, password);
    const u: AuthUser = {
      id: res.user.id,
      email: res.user.email,
      name: res.user.name,
      role: res.user.role as Role,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    localStorage.setItem("WeBAR.token", res.token);
    setUser(u);
    return u;
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await registerUser(name, email, password);
    const u: AuthUser = {
      id: res.user.id,
      email: res.user.email,
      name: res.user.name,
      role: res.user.role as Role,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    localStorage.setItem("WeBAR.token", res.token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("WeBAR.token");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
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
