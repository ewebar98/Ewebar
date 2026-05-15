import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { Bell, Check } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton, EmptyState } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getNotifications } from "@/services/api";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Notifications — Intellipath" }] }),
  component: () => <AppLayout><Notifications /></AppLayout>,
});

function Notifications() {
  const { data, loading } = useApi(getNotifications);
  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" subtitle="Stay up to date with your admissions journey." />
      {loading && <Skeleton className="h-40" />}
      {data?.length === 0 && <EmptyState icon={Bell} title="No notifications yet" />}
      <div className="space-y-3">
        {data?.map((n) => (
          <div key={n.id} className={`flex items-start justify-between rounded-2xl border p-4 shadow-soft ${n.read ? "bg-card" : "bg-accent/40"}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-1 flex h-9 w-9 items-center justify-center rounded-xl ${n.type === "warning" ? "bg-warning/15 text-warning" : n.type === "success" ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
              </div>
            </div>
            {!n.read && <Badge tone="primary"><Check className="mr-1 h-3 w-3" />New</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}
