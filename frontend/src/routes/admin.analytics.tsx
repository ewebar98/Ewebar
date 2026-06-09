import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, StatCard, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getAnalytics } from "@/services/api";
import { Users, GraduationCap, TrendingUp, FileText } from "lucide-react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Analytics — WeBAR" }] }),
  component: () => <AppLayout variant="admin"><Analytics /></AppLayout>,
});

function Analytics() {
  const { data, loading } = useApi("getAnalytics", getAnalytics);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Platform-wide performance metrics." />

      {/* Live stats from DB */}
      <div className="grid gap-4 md:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-28" /><Skeleton className="h-28" />
            <Skeleton className="h-28" /><Skeleton className="h-28" />
          </>
        ) : (
          <>
            <StatCard
              label="Total students"
              value={data?.totals?.students?.toLocaleString() ?? "—"}
              icon={Users}
              accent="primary"
              hint="Registered accounts"
            />
            <StatCard
              label="Universities"
              value={data?.totals?.universities ?? "—"}
              icon={GraduationCap}
              accent="success"
              hint="In database"
            />
            <StatCard
              label="Courses"
              value={data?.totals?.courses ?? "—"}
              icon={FileText}
              accent="warning"
              hint="Active programs"
            />
            <StatCard
              label="Applications"
              value={data?.totals?.applications?.toLocaleString() ?? "—"}
              icon={TrendingUp}
              accent="destructive"
              hint="Total submitted"
            />
          </>
        )}
      </div>

      {/* Monthly applications chart */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-semibold">Monthly applications</h3>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data?.applicationsTrend?.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.applicationsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No application data yet. Applications will appear here as students submit them.
          </div>
        )}
      </div>

      {/* Faculty mix chart */}
      {data?.facultyMix?.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold">Faculty distribution</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.facultyMix} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
