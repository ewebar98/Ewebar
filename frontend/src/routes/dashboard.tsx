import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Star, GraduationCap, Bell, FileText, TrendingUp, ArrowRight } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, StatCard, Badge } from "@/components/ui-kit";
import { getDashboardContext, getApplications } from "@/services/api";
import { Skeleton } from "@/components/ui-kit";
import { StudentAnalyticsWidgets } from "@/components/StudentAnalyticsWidgets";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Dashboard | Ewebar" }] }),
  component: () => <AppLayout><Dashboard /></AppLayout>,
});

function Dashboard() {
  const { user } = useAuth();
  
  // Single optimized call to fetch profile, recommendations, and recent notifications in parallel
  const { data: context, isLoading: lr } = useQuery({
    queryKey: ["dashboard-context"],
    queryFn: getDashboardContext,
    staleTime: 3 * 60 * 1000, // 3 minutes cache lifetime
  });

  const { data: apps } = useQuery({
    queryKey: ["applications"],
    queryFn: getApplications,
    staleTime: 5 * 60 * 1000, // 5 minutes cache lifetime
  });

  const recs = context?.recommendations || [];
  const notifs = context?.notifications || [];

  // Compute probability from top recommendation match score, or show 0 if none
  const probability = recs && recs.length > 0 ? Math.max(...recs.map((r) => r.matchPercentage || r.match || 0)) : 0;

  // Get first name from user's full name
  const firstName = user?.name?.split(" ")[0] ?? "Student";

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
            <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{firstName}</h2>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/85">
              {recs && recs.length > 0
                ? `Your admission probability looks strong. You have ${recs.length} program ${recs.length === 1 ? "match" : "matches"}.`
                : "Complete your profile to get personalized admission recommendations."}
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
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Recommendations" value={recs?.length ?? "0"} icon={Star} accent="primary" hint="Based on your profile" />
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
            {!lr && recs?.length === 0 && (
              <div className="rounded-2xl border bg-card p-8 text-center shadow-soft">
                <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No recommendations yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Update your profile with your JAMB score and interests to get matched.</p>
              </div>
            )}
            {recs?.slice(0, 3).map((r: any, i) => {
              const uniName = r.course?.institutionId?.name || r.university || "Institution";
              const courseName = r.course?.name || r.course || "Program";
              const pct = r.matchPercentage || r.match || 85;
              const cutoffVal = r.course?.cutoffMark || r.cutoff || 200;

              return (
                <motion.div
                  key={r.course?.id || r.id || i}
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
                        <p className="font-medium text-sm">{uniName}</p>
                        <p className="text-xs text-muted-foreground">{courseName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-primary">{pct}%</p>
                      <Badge tone="success">Cutoff: {cutoffVal}</Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Side widgets */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Recent activity</h3>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            {notifs && notifs.length > 0 ? (
              <ul className="space-y-3">
                {notifs.slice(0, 3).map((n) => (
                  <li key={n.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No recent activity.</p>
            )}
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
          {apps && apps.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No applications yet. Start from your <Link to="/recommendations" className="text-primary hover:underline">recommendations</Link>.
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

export const PageRoute = Route;
