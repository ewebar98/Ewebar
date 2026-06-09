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
  head: () => ({ meta: [{ title: "Analytics | WeBAR" }] }),
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
              value={data?.totals?.students?.toLocaleString() ?? "-"}
              icon={Users}
              accent="primary"
              hint="Registered accounts"
            />
            <StatCard
              label="Universities"
              value={data?.totals?.universities ?? "-"}
              icon={GraduationCap}
              accent="success"
              hint="In database"
            />
            <StatCard
              label="Courses"
              value={data?.totals?.courses ?? "-"}
              icon={FileText}
              accent="warning"
              hint="Active programs"
            />
            <StatCard
              label="Applications"
              value={data?.totals?.applications?.toLocaleString() ?? "-"}
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

      {/* Program Capacities Summary Grid */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Program capacities</h3>
          <span className="text-xs text-muted-foreground">Active Seat Allocations</span>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data?.programCapacities?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Program Name</th>
                  <th className="pb-3 px-4 text-center">Total Capacity</th>
                  <th className="pb-3 px-4 text-center">Admitted</th>
                  <th className="pb-3 px-4 text-center">Available</th>
                  <th className="pb-3 pl-4">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.programCapacities.map((prog: any, idx: number) => {
                  const isNearLimit = prog.occupancyPct >= 90;
                  const isFull = prog.occupancyPct >= 100;
                  
                  return (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium text-foreground">{prog.name}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{prog.total}</td>
                      <td className="py-3 px-4 text-center font-semibold text-foreground">{prog.admitted}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {prog.available === 0 ? (
                          <span className="text-destructive font-bold">FULL</span>
                        ) : (
                          prog.available
                        )}
                      </td>
                      <td className="py-3 pl-4 min-w-[150px]">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted shrink-0">
                            <div
                              style={{ width: `${Math.min(100, prog.occupancyPct)}%` }}
                              className={`h-full rounded-full ${
                                isFull
                                  ? "bg-destructive"
                                  : isNearLimit
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                            />
                          </div>
                          <span className={`font-bold ${
                            isFull
                              ? "text-destructive"
                              : isNearLimit
                                ? "text-amber-500"
                                : "text-emerald-500"
                          }`}>
                            {prog.occupancyPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No program capacity data available.
          </div>
        )}
      </div>
    </div>
  );
}
