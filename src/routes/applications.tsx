import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/ui-kit";
import { Skeleton, Badge } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getApplications } from "@/services/api";

export const Route = createFileRoute("/applications")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Applications — Intellipath" }] }),
  component: () => <AppLayout><Applications /></AppLayout>,
});

function Applications() {
  const { data, loading } = useApi(getApplications);
  return (
    <div className="space-y-6">
      <PageHeader title="Applications" subtitle="Track every program you've applied to." />
      {loading && <Skeleton className="h-64" />}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">University</th>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Probability</th>
              <th className="px-5 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-5 py-3 font-medium">{a.university}</td>
                <td className="px-5 py-3 text-muted-foreground">{a.course}</td>
                <td className="px-5 py-3"><Badge tone={a.status === "Accepted" ? "success" : a.status === "Draft" ? "default" : "primary"}>{a.status}</Badge></td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gradient-primary" style={{ width: `${a.probability}%` }} />
                    </div>
                    <span>{a.probability}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{a.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
