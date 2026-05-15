import { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell,
} from "recharts";
import { TrendingUp, Filter, Activity, Target } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getStudentAnalytics } from "@/services/api";
import { Skeleton } from "@/components/ui-kit";

type Range = "7d" | "30d" | "90d";

export function StudentAnalyticsWidgets() {
  const [range, setRange] = useState<Range>("30d");
  const { data, loading } = useApi(() => getStudentAnalytics(range), [range]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Your performance</h3>
          <p className="text-xs text-muted-foreground">Live insights from your AI admission profile</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="inline-flex rounded-lg border bg-card p-1 text-xs">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  range === r ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Probability trend area chart — 2/3 wide */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admission probability</p>
              <p className="mt-1 font-display text-2xl font-bold">
                {data?.probabilityTrend.at(-1)?.v ?? "—"}
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <TrendingUp className="h-3 w-3" /> +9 this {range === "7d" ? "week" : range === "30d" ? "month" : "quarter"}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={data?.probabilityTrend ?? []}>
                  <defs>
                    <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, "Match"]}
                  />
                  <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} fill="url(#probGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Skill radar */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Skill profile</p>
            <Target className="h-4 w-4 text-primary" />
          </div>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <RadarChart data={data?.skillRadar ?? []} outerRadius="75%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Match by faculty */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Match by faculty</p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={data?.matchByFaculty ?? []} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, "Match"]}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {(data?.matchByFaculty ?? []).map((d, i) => (
                      <Cell
                        key={i}
                        fill={
                          d.value >= 85
                            ? "var(--success)"
                            : d.value >= 70
                            ? "var(--primary)"
                            : "var(--warning)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Application funnel */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Application funnel</p>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-2.5">
              {(data?.applicationFunnel ?? []).map((s, i) => {
                const max = data!.applicationFunnel[0].count;
                const pct = (s.count / max) * 100;
                return (
                  <motion.div
                    key={s.stage}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{s.stage}</span>
                      <span className="text-muted-foreground">{s.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full rounded-full bg-gradient-primary"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
