import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getAnalytics } from "@/services/api";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Activity, Target, Users } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Analytics — Intellipath" }] }),
  component: () => <AppLayout variant="admin"><Analytics /></AppLayout>,
});

function Analytics() {
  const { data } = useApi(getAnalytics);
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Deep insights into platform engagement." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active users" value="12,840" icon={Users} accent="primary" hint="+12% MoM" />
        <StatCard label="Match accuracy" value="91%" icon={Target} accent="success" />
        <StatCard label="Conversion" value="24%" icon={Activity} accent="warning" />
        <StatCard label="Growth" value="+18%" icon={TrendingUp} accent="primary" />
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-semibold">Monthly applications</h3>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={data?.applicationsTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
