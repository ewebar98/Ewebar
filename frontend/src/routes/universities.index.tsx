import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Search, MapPin, Users, TrendingUp, Award, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton, EmptyState, ErrorAlert } from "@/components/ui-kit";
import { getUniversities, getCourses } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DiscoverRouteComponent = () => (
  <AppLayout>
    <Discover />
  </AppLayout>
);

export const Route = createFileRoute("/universities/")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Discover Universities — Intellipath" }] }),
  component: DiscoverRouteComponent,
});

function Discover() {
  const { data: unis, isLoading: loadingUnis, error: unisErr, isError: isUnisErr, refetch: refetchUnis } = useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
    staleTime: 5 * 60 * 1000, // 5 minutes cache lifetime
  });
  const { data: courses, error: coursesErr, isError: isCoursesErr, refetch: refetchCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
    staleTime: 10 * 60 * 1000, // 10 minutes cache lifetime
  });

  const loading = loadingUnis;

  const [q, setQ] = useState("");
  const [location, setLocation] = useState("All");
  const [program, setProgram] = useState("All");
  const [instType, setInstType] = useState("All");
  const [sort, setSort] = useState<"name" | "acceptance" | "students">("name");

  const lasustechUni = useMemo(() => {
    return (unis ?? []).find(
      (u) => u.name.includes("Lagos State University of Science") || u.name.includes("LASUSTECH")
    );
  }, [unis]);

  const locations = useMemo(() => {
    const all = (unis ?? []).map((u) => u.location.split(",")[0].trim());
    return ["All", ...Array.from(new Set(all))];
  }, [unis]);
  const programs = useMemo(() => ["All", ...Array.from(new Set((courses ?? []).map((c) => c.name)))], [courses]);

  const results = useMemo(() => {
    let r = unis ?? [];
    if (q) r = r.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));
    if (location !== "All") r = r.filter((u) => u.location.startsWith(location));
    if (instType !== "All") r = r.filter((u) => u.type === instType);
    if (program !== "All") {
      const offeringInstitutionIds = (courses ?? [])
        .filter((c) => c.name === program)
        .map((c) => c.institutionId);
      r = r.filter((u) => offeringInstitutionIds.includes(u.id));
    }
    
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "acceptance") r = [...r].sort((a, b) => b.acceptance - a.acceptance);
    if (sort === "students") r = [...r].sort((a, b) => b.students - a.students);

    // Push LASUSTECH to the top of the list if it matches filters
    const lasustechIdx = r.findIndex(
      (u) => u.name.includes("Lagos State University of Science") || u.name.includes("LASUSTECH")
    );
    if (lasustechIdx !== -1) {
      const lasustechObj = r[lasustechIdx];
      const rest = r.filter((_, idx) => idx !== lasustechIdx);
      r = [lasustechObj, ...rest]; // Assign back to r to ensure subsequent sorting applies to the modified array
    }
    return r;
  }, [unis, q, location, instType, program, courses, sort]);

  return (
    <div className="space-y-6">
      <PageHeader title="Discover institutions" subtitle="Search and filter across Nigeria's top universities, polytechnics, and colleges." />

      {/* Partnership Alert Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-card p-5 shadow-soft relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="animate-pulse"><Badge tone="success">Official Partner</Badge></span>
              <span className="text-xs font-semibold text-primary">Direct Application Integration</span>
            </div>
            <h4 className="font-display font-bold text-base text-foreground">Lagos State University of Science and Technology (LASUSTECH)</h4>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              WeBAR is in official partnership with LASUSTECH. Students can instantly match, verify results, and submit direct applications. All other institutions are on the waiting list (coming soon) but remain browseable for reference.
            </p>
          </div>
          {lasustechUni ? (
            <Link
              to="/universities/$id"
              params={{ id: lasustechUni.id }}
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gradient-primary text-xs font-semibold text-primary-foreground h-9 px-4 shadow-soft hover:shadow-elegant transition-all text-center"
            >
              Apply to LASUSTECH
            </Link>
          ) : (
            <Button disabled className="shrink-0 text-xs h-9">
              Apply to LASUSTECH
            </Button>
          )}
        </div>
      </motion.div>

      {(isUnisErr || isCoursesErr) && (
        <ErrorAlert
          title="Failed to load institutions data"
          message={unisErr?.message || coursesErr?.message || "A connection problem occurred. Please check your internet connection."}
          onRetry={() => {
            if (isUnisErr) refetchUnis();
            if (isCoursesErr) refetchCourses();
          }}
        />
      )}

      <div className="rounded-2xl border bg-card p-4 shadow-soft">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search institutions..." className="pl-9" />
          </div>
          <select
            value={instType}
            onChange={(e) => setInstType(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="All">All Types</option>
            <option value="university">Universities</option>
            <option value="polytechnic">Polytechnics</option>
            <option value="college_of_education">Colleges of Education</option>
          </select>
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
            <option value="name">Sort: Alphabetical (A-Z)</option>
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
        <EmptyState icon={Search} title="No institutions match" hint="Try removing filters or a different search." />
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
              className="group flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-elegant pt-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground font-display">
                  {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold leading-tight truncate">{u.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />{u.location}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.name.includes("Lagos State University of Science") || u.name.includes("LASUSTECH") ? (
                  <>
                    <Badge tone="success">Official Partner</Badge>
                    <Badge tone="primary">Direct Admission</Badge>
                  </>
                ) : (
                  <>
                    <Badge tone="warning">Waiting List</Badge>
                    <Badge tone="default">Coming Soon</Badge>
                  </>
                )}
                {u.tags.map((t: string) => <Badge key={t}>{t}</Badge>)}
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
              <Link
                to="/universities/$id"
                params={{ id: u.id }}
                className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-gradient-primary text-sm font-semibold text-primary-foreground h-9 px-4 shadow-soft hover:shadow-elegant transition-all text-center"
              >
                View details
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
