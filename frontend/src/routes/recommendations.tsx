import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Search, Star, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton, ErrorAlert } from "@/components/ui-kit";
import { getProfile, getRecommendations } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recommendations")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Recommendations | WeBAR" }] }),
  component: () => <AppLayout><Recommendations /></AppLayout>,
});

// Confidence badge colour map
const confidenceStyle: Record<string, string> = {
  High: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Low: "text-destructive bg-destructive/10 border-destructive/20",
};

// PASS / FAIL / WARN row icons
function BreakdownIcon({ type }: { type: "PASS" | "FAIL" | "WARN" }) {
  if (type === "PASS") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (type === "FAIL") return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
}

function Recommendations() {
  const { data, isLoading: loading, error, isError, refetch } = useQuery({
    queryKey: ["recommendations"],
    queryFn: getRecommendations,
    staleTime: 5 * 60 * 1000,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "high">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = (data ?? [])
    .filter((r) => r.university?.toLowerCase().includes(q.toLowerCase()) || r.course?.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (filter === "high" ? (r.match !== null && r.match >= 85) : true));

  return (
    <div className="space-y-6">
      <PageHeader title="Your recommendations" subtitle="Programs ranked by AI match score." />

      {isError && (
        <ErrorAlert
          title="Failed to load recommendations"
          message={error instanceof Error ? error.message : "A connection problem occurred. Please check your internet connection."}
          onRetry={refetch}
        />
      )}

      {profile?.preferredCourse && (
        <div className="rounded-2xl border p-4 bg-muted/20 text-xs">
          <p className="font-semibold text-foreground">Preferred Program: {profile.preferredCourse}</p>
          <p className="text-muted-foreground mt-1">
            If you meet all the prerequisite cutoffs and subject requirements, you can apply directly to your preferred course. The list below highlights alternative matching programs.
          </p>
        </div>
      )}

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
        {!loading && filtered.length === 0 && (
          <div className="md:col-span-2 rounded-2xl border border-dashed p-12 text-center bg-card shadow-soft">
            <Star className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground">
              {q || filter === "high" ? "No recommendations match your filter" : "No eligible recommendations for your current JAMB score"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {q
                ? `Try a different search term or clear the filter.`
                : filter === "high"
                  ? "No programs currently score 85%+ for your profile."
                  : profile?.jambScore
                    ? profile.jambScore < 200
                      ? `Your JAMB score is ${profile.jambScore}. Since there are no eligible courses at LASUSTECH matching this score, we strongly recommend preparing to sit for JAMB again to target 200 or above for university eligibility.`
                      : `Your JAMB score is ${profile.jambScore}. Please consider checking your academic locker and ensure correct subject combinations are configured.`
                    : "Update your profile with your JAMB score and interests to get matched."}
            </p>
          </div>
        )}
        {filtered.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border bg-card p-5 shadow-soft"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to="/universities/$id" params={{ id: r.universityId }} className="font-display text-lg font-semibold hover:text-primary">
                  {r.university}
                </Link>
                <p className="text-sm text-muted-foreground">{r.course}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.cutoff !== null && <Badge tone="primary">Cutoff {r.cutoff}</Badge>}
                  <Badge tone="success">{r.slots} slots</Badge>
                  {/* Confidence badge */}
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${confidenceStyle[r.confidence] ?? confidenceStyle.Medium}`}>
                    {r.confidence} Confidence
                  </span>
                </div>
              </div>
              <div className="text-right">
                {r.match !== null ? (
                  <>
                    <p className="font-display text-3xl font-bold gradient-text">{r.match}%</p>
                    <p className="text-xs text-muted-foreground">match</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic font-semibold text-muted-foreground/80">No score yet</p>
                )}
              </div>
            </div>

            {/* Match progress bar */}
            {r.match !== null && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${r.match}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-primary"
                />
              </div>
            )}

            {/* Decision Breakdown toggle */}
            <button
              onClick={() => setOpenId(openId === r.id ? null : r.id)}
              className="mt-4 flex w-full items-center justify-between rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
            >
              <span className="flex items-center gap-2"><Star className="h-3.5 w-3.5" /> Decision Breakdown</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openId === r.id ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {openId === r.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {/* PASS / FAIL / WARN rows */}
                  {r.breakdown.length > 0 && (
                    <div className="mt-3 rounded-xl border bg-muted/30 divide-y divide-border/50">
                      {r.breakdown.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 px-4 py-2.5">
                          <BreakdownIcon type={item.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground">{item.field}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider shrink-0 ${
                            item.type === "PASS" ? "text-emerald-500" : item.type === "FAIL" ? "text-destructive" : "text-amber-500"
                          }`}>{item.type}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recourse Advisory Panel */}
                  {r.recourseActions.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40 p-4 space-y-3">
                      <p className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Recourse Advisory</p>
                      {r.recourseActions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-xs text-foreground leading-relaxed">{action.message}</p>
                            <Link
                              to={action.actionLink as any}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                            >
                              Take action <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <Link
                to="/universities/$id"
                params={{ id: r.universityId }}
                className="flex-1 inline-flex items-center justify-center rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-semibold h-9 px-3 transition-all text-center"
              >
                View university
              </Link>
              <Link
                to="/courses/$id"
                params={{ id: r.courseId }}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-primary text-xs font-semibold text-primary-foreground h-9 px-3 shadow-soft hover:shadow-elegant transition-all text-center"
              >
                View course
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
