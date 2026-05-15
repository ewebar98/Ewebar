import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, StatCard, Skeleton } from "@/components/ui-kit";
import { Users, GraduationCap, Wallet, FileText, Filter, TrendingUp } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getAnalytics } from "@/services/api";
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Admin — Intellipath" }] }),
  component: () => <AppLayout variant="admin"><AdminOverview /></AppLayout>,
});

const COLORS = ["oklch(0.52 0.21 277)", "oklch(0.7 0.15 162)", "oklch(0.78 0.16 75)", "oklch(0.66 0.19 285)", "oklch(0.62 0.22 27)"];

type Range = "7d" | "30d" | "90d";

function AdminOverview() {
  const { data, loading } = useApi(getAnalytics);
  const [range, setRange] = useState<Range>("30d");
  const [faculty, setFaculty] = useState<string>("All");

  // Synthesize a finer-grained trend for the selected range from the mock monthly data
  const seriesByRange = useMemo(() => {
    const base = data?.applicationsTrend ?? [];
    if (!base.length) return [];
    if (range === "7d")
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
        label: d, value: Math.round((base.at(-1)?.value ?? 800) * (0.7 + i * 0.05)),
      }));
    if (range === "30d")
      return Array.from({ length: 30 }, (_, i) => ({
        label: `D${i + 1}`,
        value: Math.round((base.at(-1)?.value ?? 800) * (0.55 + Math.sin(i / 4) * 0.1 + i * 0.012)),
      }));
    return base.map((b) => ({ label: b.month, value: b.value }));
  }, [data, range]);

  const facultyMix = useMemo(() => {
    const list = data?.facultyMix ?? [];
    return faculty === "All" ? list : list.filter((f) => f.name === faculty);
  }, [data, faculty]);

  const facultyOptions = ["All", ...(data?.facultyMix ?? []).map((f) => f.name)];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin overview" subtitle="Platform health at a glance." />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-soft">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-xs"
          >
            {facultyOptions.map((f) => <option key={f}>{f}</option>)}
          </select>
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

      <div className="grid gap-4 md:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
          </>
        ) : (
          <>
            <StatCard label="Students" value={data?.totals.students.toLocaleString() ?? "—"} icon={Users} accent="primary" hint="+12% MoM" />
            <StatCard label="Universities" value={data?.totals.universities ?? "—"} icon={GraduationCap} accent="success" />
            <StatCard label="Scholarships" value={data?.totals.scholarships ?? "—"} icon={Wallet} accent="warning" />
            <StatCard label="Applications" value={data?.totals.applications.toLocaleString() ?? "—"} icon={FileText} hint="+8% WoW" />
          </>
        )}
      </div>

      {/* Premium trend with area + line overlay */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-card p-6 shadow-soft"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Applications trend</p>
            <p className="font-display text-2xl font-bold">
              {seriesByRange.at(-1)?.value.toLocaleString() ?? "—"}
              <span className="ml-2 text-sm font-medium text-muted-foreground">latest</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <TrendingUp className="h-3 w-3" /> Strong growth
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={seriesByRange}>
                <defs>
                  <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#appGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2"
        >
          <h3 className="mb-4 font-display text-lg font-semibold">Conversion velocity</h3>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={seriesByRange}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card p-6 shadow-soft"
        >
          <h3 className="mb-4 font-display text-lg font-semibold">Faculty mix</h3>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={facultyMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {facultyMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top universities by application volume (mock derived) */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border bg-card p-6 shadow-soft"
      >
        <h3 className="mb-4 font-display text-lg font-semibold">Top universities by applications</h3>
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart
                data={[
                  { name: "UNILAG", value: 2450 },
                  { name: "Covenant", value: 1820 },
                  { name: "OAU", value: 1640 },
                  { name: "UI", value: 1420 },
                  { name: "ABU", value: 1180 },
                  { name: "Pan-Atlantic", value: 720 },
                ]}
                layout="vertical"
                margin={{ left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
}
