// src/layouts/AdminLayout.tsx
import type { ReactNode } from "react";
import { AppLayout } from "./AppLayout";

/**
 * Thin wrapper that renders the shared AppLayout in admin variant.
 * Import this in all admin route components instead of AppLayout directly.
 */
export function AdminLayout({ children }: { children?: ReactNode }) {
  return <AppLayout variant="admin">{children}</AppLayout>;
}
