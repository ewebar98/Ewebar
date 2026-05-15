import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getRecommendations } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recommendations")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Recommendations — Intellipath" }] }),
  component: () => <AppLayout><Recommendations /></AppLayout>,
});

function Recommendations() {
  const { data, loading } = useApi(getRecommendations);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "high">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = (data ?? [])
    .filter((r) => r.university.toLowerCase().includes(q.toLowerCase()) || r.course.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (filter === "high" ? r.match >= 85 : true));

  return (
    <div className="space-y-6">
      <PageHeader title="Your recommendations" subtitle="Programs ranked by AI match score." />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search universities or courses..." className="pl-9" />
        </div>
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
        <Button variant={filter === "high" ? "default" : "outline"} onClick={() => setFilter("high")}>High match (85%+)</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        {filtered.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border bg-card p-5 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to="/universities/$id" params={{ id: r.universityId }} className="font-display text-lg font-semibold hover:text-primary">
                  {r.university}
                </Link>
                <p className="text-sm text-muted-foreground">{r.course}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="primary">Cutoff {r.cutoff}</Badge>
                  <Badge tone="success">{r.slots} slots</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold gradient-text">{r.match}%</p>
                <p className="text-xs text-muted-foreground">match</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${r.match}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-primary"
              />
            </div>
            <button
              onClick={() => setOpenId(openId === r.id ? null : r.id)}
              className="mt-4 flex w-full items-center justify-between rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
            >
              <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Why this recommendation?</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openId === r.id ? "rotate-180" : ""}`} />
            </button>
            {openId === r.id && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 text-sm text-muted-foreground"
              >
                {r.reason}
              </motion.p>
            )}
            <div className="mt-4 flex gap-2">
              <Link to="/universities/$id" params={{ id: r.universityId }} className="flex-1">
                <Button variant="outline" className="w-full">View university</Button>
              </Link>
              <Link to="/courses/$id" params={{ id: r.courseId }} className="flex-1">
                <Button className="w-full bg-gradient-primary">View course</Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
