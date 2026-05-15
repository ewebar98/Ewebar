import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getUniversityById, getCourses } from "@/services/api";
import { Button } from "@/components/ui/button";
import { MapPin, Users, TrendingUp, Award } from "lucide-react";

export const Route = createFileRoute("/universities/$id")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "University — Intellipath" }] }),
  component: () => <AppLayout><UniversityDetails /></AppLayout>,
});

function UniversityDetails() {
  const { id } = Route.useParams();
  const { data: uni, loading } = useApi(() => getUniversityById(id), [id]);
  const { data: courses } = useApi(getCourses);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!uni) return <p className="text-center text-muted-foreground">Not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={uni.name} subtitle={uni.location} />

      <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card text-4xl shadow-elegant">
            {uni.logo}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">{uni.name}</h2>
            <p className="text-muted-foreground"><MapPin className="mr-1 inline h-3.5 w-3.5" />{uni.location}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {uni.tags.map((t) => <Badge key={t} tone="primary">{t}</Badge>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Ranking", value: `#${uni.ranking}`, icon: Award },
          { label: "Students", value: uni.students.toLocaleString(), icon: Users },
          { label: "Acceptance", value: `${uni.acceptance}%`, icon: TrendingUp },
          { label: "Tuition", value: uni.tuition, icon: Award },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="font-display text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-semibold">Popular programs</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {courses?.slice(0, 4).map((c) => (
            <Link key={c.id} to="/courses/$id" params={{ id: c.id }} className="rounded-xl border p-4 hover:bg-accent">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.faculty} · {c.duration}</p>
            </Link>
          ))}
        </div>
      </div>

      <Button className="bg-gradient-primary">Apply now</Button>
    </div>
  );
}
