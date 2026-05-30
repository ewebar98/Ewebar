import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";

export const Route = createFileRoute("/universities")({
  beforeLoad: requireRole("student"),
  component: () => <Outlet />,
});

