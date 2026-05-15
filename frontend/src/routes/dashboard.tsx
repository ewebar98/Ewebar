import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Star, GraduationCap, Wallet, Bell, FileText, TrendingUp, ArrowRight } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, StatCard, Badge } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getRecommendations, getScholarships, getApplications, getNotifications } from "@/services/api";
import { Skeleton } from "@/components/ui-kit";
import { StudentAnalyticsWidgets } from "@/components/StudentAnalyticsWidgets";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Dashboard | Intellipath" }] }),
  component: () => <AppLayout><Dashboard /></AppLayout>,
});

function Dashboard() {
  const { data: recs, loading: lr } = useApi(getRecommendations);
  const { data: scholarships } = useApi(getScholarships);
  const { data: apps } = useApi(getApplications);
  const { data: notifs } = useApi(getNotifications);

  const probability = 87;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-elegant md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm text-primary-foreground/80">Good to see you,</p>
            <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">Ada 👋</h2>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/85">
              Your admission probability looks strong this week. We have 3 new program matches.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                <motion.circle
                  cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="100"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - probability }}
                  transition={{ duration: 1.2 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold">{probability}%</span>
                <span className="text-[10px] uppercase tracking-wider text-primary-foreground/80">match</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Recommendations" value={recs?.length ?? "0"} icon={Star} accent="primary" hint="3 new today" />
        <StatCard label="Scholarships" value={scholarships?.length ?? "0"} icon={Wallet} accent="success" hint="Eligible" />
        <StatCard label="Applications" value={apps?.length ?? "0"} icon={FileText} accent="warning" hint="Track progress" />
        <StatCard label="Notifications" value={notifs?.filter((n) => !n.read).length ?? "0"} icon={Bell} accent="destructive" hint="Unread" />
      </div>

      {/* Premium analytics widgets */}
      <StudentAnalyticsWidgets />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Top recommendations</h3>
            <Link to="/recommendations" className="text-sm text-primary hover:underline">View all <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          <div className="space-y-3">
            {lr && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            {recs?.slice(0, 3).map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border bg-card p-4 shadow-soft"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{r.university}</p>
                      <p className="text-xs text-muted-foreground">{r.course}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-primary">{r.match}%</p>
                    <Badge tone="success">{r.slots} slots</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Side widgets */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Scholarships closing soon</h3>
              <Link to="/scholarships" className="text-xs text-primary">All</Link>
            </div>
            <ul className="space-y-3">
              {scholarships?.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.amount}</p>
                  </div>
                  <Badge tone="warning">{s.deadline.slice(5)}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Recent activity</h3>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <ul className="space-y-3">
              {notifs?.slice(0, 3).map((n) => (
                <li key={n.id} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Applications table */}
      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="font-display text-lg font-semibold">Recent applications</h3>
          <Link to="/applications" className="text-sm text-primary">View all</Link>
        </div>
        <div className="overflow-x-auto">
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
              {apps?.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-5 py-3 font-medium">{a.university}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.course}</td>
                  <td className="px-5 py-3">
                    <Badge tone={a.status === "Accepted" ? "success" : a.status === "Draft" ? "default" : "primary"}>{a.status}</Badge>
                  </td>
                  <td className="px-5 py-3">{a.probability}%</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.submitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const PageRoute = Route;
