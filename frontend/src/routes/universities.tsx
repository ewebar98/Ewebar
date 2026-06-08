import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";

const UniversitiesRouteComponent = () => <Outlet />;

export const Route = createFileRoute("/universities")({
  beforeLoad: requireRole("student"),
  component: UniversitiesRouteComponent,
});

