import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getCourses } from "@/services/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/courses")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Manage Courses — Intellipath" }] }),
  component: () => <AppLayout variant="admin"><ManageCourses /></AppLayout>,
});

function ManageCourses() {
  const { data, loading } = useApi(getCourses);
  return (
    <div className="space-y-6">
      <PageHeader title="Manage courses" subtitle="Curate the catalog of available programs." action={
        <Button className="bg-gradient-primary"><Plus className="mr-1 h-4 w-4" /> Add course</Button>
      } />
      {loading && <Skeleton className="h-64" />}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.faculty} · {c.duration}</p>
              </div>
              <Badge tone="primary">Cutoff {c.cutoff}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-4 flex justify-end gap-1">
              <button className="rounded-md p-1.5 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
              <button className="rounded-md p-1.5 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
