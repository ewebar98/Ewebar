import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Search, MapPin, Users, TrendingUp, Award, SlidersHorizontal } from "lucide-react";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton, EmptyState } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getUniversities, getCourses } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/universities")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Discover Universities — Intellipath" }] }),
  component: () => <AppLayout><Discover /></AppLayout>,
});

function Discover() {
  const { data: unis, loading } = useApi(getUniversities);
  const { data: courses } = useApi(getCourses);

  const [q, setQ] = useState("");
  const [location, setLocation] = useState("All");
  const [program, setProgram] = useState("All");
  const [sort, setSort] = useState<"ranking" | "acceptance" | "students">("ranking");

  const locations = useMemo(() => {
    const all = (unis ?? []).map((u) => u.location.split(",")[0].trim());
    return ["All", ...Array.from(new Set(all))];
  }, [unis]);
  const programs = ["All", ...(courses ?? []).map((c) => c.name)];

  const results = useMemo(() => {
    let r = unis ?? [];
    if (q) r = r.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));
    if (location !== "All") r = r.filter((u) => u.location.startsWith(location));
    // program filter is decorative for mock data — always retains list
    if (sort === "ranking") r = [...r].sort((a, b) => a.ranking - b.ranking);
    if (sort === "acceptance") r = [...r].sort((a, b) => b.acceptance - a.acceptance);
    if (sort === "students") r = [...r].sort((a, b) => b.students - a.students);
    return r;
  }, [unis, q, location, sort]);

  return (
    <div className="space-y-6">
      <PageHeader title="Discover universities" subtitle="Search and filter across Nigeria's top institutions." />

      <div className="rounded-2xl border bg-card p-4 shadow-soft">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search universities..." className="pl-9" />
          </div>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {programs.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ranking">Sort: Ranking</option>
            <option value="acceptance">Sort: Acceptance %</option>
            <option value="students">Sort: Student body</option>
          </select>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {loading ? "Loading…" : `${results.length} results`}
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-56" />)}
        </div>
      )}

      {!loading && results.length === 0 && (
        <EmptyState icon={Search} title="No universities match" hint="Try removing filters or a different search." />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {results.map((u, i) => (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 24 }}
              whileHover={{ y: -4 }}
              className="group flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-elegant"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary/10 text-3xl">
                  {u.logo}
                </div>
                <Badge tone="primary">#{u.ranking}</Badge>
              </div>
              <h3 className="font-display text-lg font-semibold">{u.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />{u.location}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.tags.map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-muted/50 p-2">
                  <Users className="mb-1 h-3 w-3 text-muted-foreground" />
                  <p className="font-semibold">{(u.students / 1000).toFixed(0)}k</p>
                  <p className="text-muted-foreground">students</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <TrendingUp className="mb-1 h-3 w-3 text-muted-foreground" />
                  <p className="font-semibold">{u.acceptance}%</p>
                  <p className="text-muted-foreground">accept</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <Award className="mb-1 h-3 w-3 text-muted-foreground" />
                  <p className="font-semibold text-[11px]">{u.tuition.split("/")[0]}</p>
                  <p className="text-muted-foreground">tuition</p>
                </div>
              </div>
              <Link to="/universities/$id" params={{ id: u.id }} className="mt-4">
                <Button className="w-full bg-gradient-primary" size="sm">View details</Button>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
