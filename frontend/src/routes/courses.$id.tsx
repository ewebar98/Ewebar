import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Skeleton, Badge, ErrorAlert } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getCourseById } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Target } from "lucide-react";

export const Route = createFileRoute("/courses/$id")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Course — WeBAR" }] }),
  component: () => <AppLayout><CourseDetails /></AppLayout>,
});

function CourseDetails() {
  const { id } = Route.useParams();
  const { data: c, loading, error, refresh } = useApi(() => getCourseById(id), [id]);
  if (error) {
    return (
      <div className="py-12">
        <ErrorAlert
          title="Failed to load course details"
          message={error.message || "A connection problem occurred. Please check your internet connection."}
          onRetry={refresh}
        />
      </div>
    );
  }
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!c) return <p className="text-center text-muted-foreground py-8">Course not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={c.name} subtitle={c.faculty} />
      <div className="rounded-3xl bg-gradient-hero p-8">
        <Badge tone="primary">{c.faculty}</Badge>
        <h2 className="mt-3 font-display text-3xl font-bold">{c.name}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{c.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Clock, label: "Duration", value: c.duration },
          { icon: Target, label: "Cutoff", value: c.cutoff },
          { icon: BookOpen, label: "Faculty", value: c.faculty },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="font-display text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
      <Button className="bg-gradient-primary">Save course</Button>
    </div>
  );
}
