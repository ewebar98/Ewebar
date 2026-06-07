import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { 
  Star, GraduationCap, Bell, FileText, TrendingUp, ArrowRight,
  CheckCircle, Circle, ClipboardList, UserCheck, ShieldCheck, Zap,
  Loader2, AlertCircle, Sparkles
} from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, StatCard, Badge, ErrorAlert } from "@/components/ui-kit";
import { 
  getDashboardContext, getApplications, submitApplication, 
  getUniversities, getUniversityById 
} from "@/services/api";
import { Skeleton } from "@/components/ui-kit";
import { StudentAnalyticsWidgets } from "@/components/StudentAnalyticsWidgets";
import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";

const FALLBACK_LASUSTECH_COURSES = [
  "Agricultural Science",
  "Biochemistry",
  "Microbiology",
  "Computer Science",
  "Accounting",
  "Business Administration",
  "Mass Communication",
  "Civil and Environmental Engineering",
  "Mechanical Engineering",
  "Electrical and Electronics Engineering"
];

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Dashboard | WeBAR" }] }),
  component: () => <AppLayout><Dashboard /></AppLayout>,
});

function Dashboard() {
  const { user } = useAuth();
  const [applying, setApplying] = useState(false);
  
  // Single optimized call to fetch profile, recommendations, and recent notifications in parallel
  const { data: context, isLoading: lr, error: contextErr, isError: isContextErr, refetch: refetchContext } = useQuery({
    queryKey: ["dashboard-context"],
    queryFn: getDashboardContext,
    staleTime: 3 * 60 * 1000, // 3 minutes cache lifetime
  });

  const { data: apps, error: appsErr, isError: isAppsErr, refetch: refetchApps } = useQuery({
    queryKey: ["applications"],
    queryFn: getApplications,
    staleTime: 5 * 60 * 1000, // 5 minutes cache lifetime
  });

  // Fetch LASUSTECH courses dynamically to enable quick application submission
  const { data: schools } = useApi(getUniversities);
  const lasustechUni = schools?.find(
    (u) => u.name.includes("Lagos State University of Science") || u.name.includes("LASUSTECH")
  );

  const { data: lasustechData } = useApi(
    () => (lasustechUni ? getUniversityById(lasustechUni.id) : Promise.resolve(null)),
    [lasustechUni?.id]
  );

  const lasustechCourses = lasustechData?.courses || [];

  const recs = context?.recommendations || [];
  const notifs = context?.notifications || [];

  // Compute probability from top recommendation match score, or show 0 if none
  const probability = recs && recs.length > 0 ? Math.max(...recs.map((r) => r.matchPercentage || r.match || 0)) : 0;

  // Get first name from user's full name
  const firstName = user?.name?.split(" ")[0] ?? "Student";

  // Step calculations based on actual student status
  const hasJamb = context?.profile?.jambScore > 0;
  const hasOLevel = context?.profile?.olevelSittings && context?.profile?.olevelSittings.length > 0;
  const academicComplete = hasJamb && hasOLevel;

  const profileComplete = !!(
    context?.profile?.stateOfOrigin &&
    context?.profile?.lga &&
    context?.profile?.preferredCourse &&
    context?.profile?.bio
  );

  const hasApplied = apps?.some(
    (a) => a.university.includes("Lagos State University of Science") || a.university.includes("LASUSTECH")
  );

  let currentStep = 1;
  if (!academicComplete) {
    currentStep = 1;
  } else if (!profileComplete) {
    currentStep = 2;
  } else if (!hasApplied) {
    currentStep = 3;
  } else {
    currentStep = 4;
  }

  // Quick Apply action
  const handleQuickApply = async () => {
    if (!lasustechUni) {
      toast.error("LASUSTECH university record not found");
      return;
    }
    const preferredCourseObj = lasustechCourses?.find(
      (c) => c.name === context?.profile?.preferredCourse
    );
    if (!preferredCourseObj) {
      toast.error("Please select a valid preferred course in your profile first");
      return;
    }
    setApplying(true);
    try {
      await submitApplication(lasustechUni.id, preferredCourseObj.id, []);
      toast.success(`Application to LASUSTECH for ${preferredCourseObj.name} submitted successfully!`);
      refetchApps();
      refetchContext();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {(isContextErr || isAppsErr) && (
        <ErrorAlert
          title="Failed to load dashboard data"
          message={
            contextErr instanceof Error ? contextErr.message : appsErr instanceof Error ? appsErr.message : "A connection problem occurred. Please check your internet connection and try again."
          }
          onRetry={() => {
            if (isContextErr) refetchContext();
            if (isAppsErr) refetchApps();
          }}
        />
      )}

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-elegant md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm text-primary-foreground/80 font-medium">Welcome back to WeBAR,</p>
            <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{firstName}</h2>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/85">
              {recs && recs.length > 0
                ? `You have matched with ${recs.length} program option${recs.length === 1 ? "" : "s"} at LASUSTECH.`
                : "Complete your admissions stepper below to apply directly to LASUSTECH."}
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
                <span className="text-[10px] uppercase tracking-wider text-primary-foreground/80">Match Rate</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dynamic Admissions Stepper Hub */}
      <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-6">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            LASUSTECH Admission Walkthrough Hub
          </h3>
          <p className="text-xs text-muted-foreground">Complete each step to directly apply to Lagos State University of Science and Technology.</p>
        </div>

        {/* Stepper Steps UI */}
        <div className="grid gap-4 sm:grid-cols-4 border-b pb-6">
          {[
            { id: 1, label: "Academic Locker", desc: "Upload WAEC/JAMB", done: academicComplete },
            { id: 2, label: "Demographics", desc: "Bio, State & LGA", done: profileComplete },
            { id: 3, label: "Eligibility Match", desc: "View Recommendations", done: academicComplete && profileComplete },
            { id: 4, label: "Direct Apply", desc: "Submit to LASUSTECH", done: hasApplied }
          ].map((s) => {
            const isActive = currentStep === s.id;
            const isDone = s.done;
            return (
              <div 
                key={s.id}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all duration-300 ${
                  isActive ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-sm" : "border-transparent opacity-80"
                }`}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  ) : isActive ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary bg-primary/10">
                      {s.id}
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                  )}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isActive ? "text-primary" : "text-foreground"}`}>{s.label}</h4>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Walkthrough Content based on currentStep */}
        <div className="bg-muted/30 p-5 rounded-2xl border min-h-[160px] flex flex-col justify-between">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h4 className="font-display text-sm font-semibold">Step 1: Synchronize Academic Results</h4>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">
                We need your JAMB UTME score and O'Level sittings details to check your cutoff compatibility and subject prerequisites against official LASUSTECH standards.
              </p>
              <div className="flex flex-wrap gap-3 items-center pt-2">
                <Link to="/documents">
                  <button className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow hover:bg-primary/95 flex items-center gap-1.5">
                    Open Academic Locker
                    <ArrowRight className="h-3..5 w-3.5" />
                  </button>
                </Link>
                <span className="text-[11px] text-muted-foreground italic">
                  {!hasJamb && "JAMB score missing. "}
                  {!hasOLevel && "O'Level details missing."}
                </span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <h4 className="font-display text-sm font-semibold">Step 2: Update Bio & Demographics</h4>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Lagos State University of Science and Technology (LASUSTECH) requires State of Origin and LGA verification. Please set these in your profile along with your career bio and preferred course choice.
              </p>
              <div className="flex flex-wrap gap-3 items-center pt-2">
                <Link to="/profile">
                  <button className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow hover:bg-primary/95 flex items-center gap-1.5">
                    Update Profile Details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
                <span className="text-[11px] text-muted-foreground italic">
                  Set State, LGA, preferred course, and Bio to unlock matching.
                </span>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h4 className="font-display text-sm font-semibold">Step 3: Eligibility Match Check</h4>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Excellent! Your profile is verified. Below, you can see your matching programs. Your preferred course is <b>{context?.profile?.preferredCourse}</b>.
              </p>
              <div className="flex flex-wrap gap-3 items-center pt-2">
                <Link to="/recommendations">
                  <button className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow hover:bg-primary/95 flex items-center gap-1.5">
                    View Course Eligibility matches
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary animate-pulse" />
                <h4 className="font-display text-sm font-semibold text-primary">Step 4: Direct Application Submission</h4>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">
                All prerequisites met! You are fully eligible to apply. Submit your direct application to <b>Lagos State University of Science and Technology</b> for your preferred program: <b>{context?.profile?.preferredCourse}</b>.
              </p>
              
              {!hasApplied ? (
                <div className="pt-2">
                  <button 
                    onClick={handleQuickApply}
                    disabled={applying}
                    className="rounded-xl bg-gradient-primary px-5 py-2.5 text-xs font-bold text-white shadow-glow hover:brightness-105 flex items-center gap-2"
                  >
                    {applying ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting application...</>
                    ) : (
                      <><Zap className="h-4 w-4" /> Apply to LASUSTECH Now</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-success/10 border border-success/30 p-3 rounded-xl max-w-md">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-xs font-bold text-success-foreground">Applied successfully!</p>
                    <p className="text-[10px] text-muted-foreground">Track status under <Link to="/applications" className="text-primary hover:underline">Applications</Link>.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="LASUSTECH matches" value={recs?.length ?? "0"} icon={Star} accent="primary" hint="Based on your profile" />
        <StatCard label="Applications" value={apps?.length ?? "0"} icon={FileText} accent="warning" hint="Track progress" />
        <StatCard label="Notifications" value={notifs?.filter((n) => !n.read).length ?? "0"} icon={Bell} accent="destructive" hint="Unread" />
      </div>

      {/* Premium analytics widgets */}
      <StudentAnalyticsWidgets />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Top matches at LASUSTECH</h3>
            <Link to="/recommendations" className="text-sm text-primary hover:underline">View all <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          <div className="space-y-3">
            {lr && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            {!lr && recs?.length === 0 && (
              <div className="rounded-2xl border bg-card p-8 text-center shadow-soft">
                <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No matches yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Ensure your JAMB & WAEC aggregate meets LASUSTECH cutoffs to display recommendations.</p>
              </div>
            )}
            {recs?.slice(0, 3).map((r: any, i) => {
              const uniName = r.course?.institutionId?.name || r.university || "Lagos State University of Science and Technology";
              const courseName = r.course?.name || r.course || "Program";
              const pct = r.matchPercentage || r.match || null;
              const cutoffVal = r.course?.cutoffMark || r.cutoff || null;

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
                      {pct !== null ? (
                        <p className="font-display text-xl font-bold text-primary">{pct}%</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No score yet</p>
                      )}
                      {cutoffVal !== null && <Badge tone="success">Cutoff: {cutoffVal}</Badge>}
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
              <h3 className="font-display text-sm font-semibold">Recent Activity</h3>
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
          <h3 className="font-display text-lg font-semibold">Your applications</h3>
          <Link to="/applications" className="text-sm text-primary">View all</Link>
        </div>
        <div className="overflow-x-auto">
          {apps && apps.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No applications yet. Start from your admissions stepper above.
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
