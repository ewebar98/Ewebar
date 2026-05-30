import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { getUniversityById, getUploadedDocuments, getProfile, submitApplication } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Users, TrendingUp, Award, Check, ChevronRight, AlertTriangle, FileText, X, Search, BookOpen } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/universities/$id")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "University — Ewebar" }] }),
  component: () => <AppLayout><UniversityDetails /></AppLayout>,
});

function UniversityDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: uni, isLoading: loadingUni } = useQuery({
    queryKey: ["university", id],
    queryFn: () => getUniversityById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes cache lifetime
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes cache lifetime
  });
  const { data: userDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: getUploadedDocuments,
    staleTime: 2 * 60 * 1000, // 2 minutes cache lifetime
  });

  const loading = loadingUni;

  // Application wizard state
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFacultyTab, setActiveFacultyTab] = useState<string>("");

  const universityCourses = uni?.courses || [];

  // 1. Extract unique faculties from the university courses
  const faculties = useMemo(() => {
    const facSet = new Set<string>();
    universityCourses.forEach((c) => {
      if (c.faculty) facSet.add(c.faculty);
    });
    return Array.from(facSet).sort();
  }, [universityCourses]);

  // 2. Set the first faculty as active tab if none is selected yet
  useEffect(() => {
    if (faculties.length > 0 && !activeFacultyTab) {
      setActiveFacultyTab(faculties[0]);
    }
  }, [faculties, activeFacultyTab]);

  // 3. Filter courses by search query
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return universityCourses;
    return universityCourses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.department && c.department.toLowerCase().includes(q)) ||
        c.description.toLowerCase().includes(q)
    );
  }, [universityCourses, searchQuery]);

  // 4. Group filtered courses by Faculty -> Department
  const groupedCourses = useMemo(() => {
    const isSearching = searchQuery.trim() !== "";
    const coursesToGroup = isSearching 
      ? filteredCourses 
      : filteredCourses.filter((c) => c.faculty === activeFacultyTab);

    // Structure: { [faculty: string]: { [department: string]: Course[] } }
    const groups: { [facName: string]: { [deptName: string]: any[] } } = {};

    coursesToGroup.forEach((c) => {
      const fac = c.faculty || "Sciences";
      const dept = c.department || "General Department";
      if (!groups[fac]) {
        groups[fac] = {};
      }
      if (!groups[fac][dept]) {
        groups[fac][dept] = [];
      }
      groups[fac][dept].push(c);
    });

    return groups;
  }, [filteredCourses, activeFacultyTab, searchQuery]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!uni) return <p className="text-center text-muted-foreground">Not found.</p>;

  const selectedCourse = universityCourses.find((c) => c.id === selectedCourseId);
  const studentJambScore = profile?.jambScore || 180;


  // Compute cutoff eligibility
  const isCutoffMet = selectedCourse ? studentJambScore >= selectedCourse.cutoff : false;

  // Handle checking document locker items
  const toggleDoc = (url: string) => {
    setSelectedDocs((prev) =>
      prev.includes(url) ? prev.filter((d) => d !== url) : [...prev, url]
    );
  };

  const handleApplySubmit = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a program");
      return;
    }
    setIsSubmitting(true);
    try {
      // Map document urls to names for saving
      const attached = (userDocs || [])
        .filter((d) => selectedDocs.includes(d.url))
        .map((d) => ({ name: d.name, url: d.url }));

      await submitApplication(uni.id, selectedCourseId, attached);
      toast.success(`Successfully applied to ${selectedCourse?.name || "Program"}!`);
      setIsOpen(false);
      navigate({ to: "/applications" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={uni.name} subtitle={uni.location} />

      <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-xl font-bold text-primary-foreground font-display shadow-soft">
            {uni.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">{uni.name}</h2>
            <p className="text-muted-foreground">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {uni.location}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {uni.tags.map((t: string) => (
                <Badge key={t} tone="primary">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Students", value: uni.students.toLocaleString(), icon: Users },
          { label: "Acceptance", value: `${uni.acceptance}%`, icon: TrendingUp },
          { label: "Tuition", value: uni.tuition, icon: Award },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="font-display text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Offered Programs</h3>
            <p className="text-xs text-muted-foreground">Browse courses relationally grouped by faculties and departments.</p>
          </div>
          <div className="relative w-full sm:max-w-xs shrink-0">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs..."
              className="pl-9 h-9 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* 1. Tab Switcher (Only visible when search is empty) */}
        {searchQuery.trim() === "" && faculties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b pb-4">
            {faculties.map((fac) => {
              const isActive = activeFacultyTab === fac;
              return (
                <button
                  key={fac}
                  type="button"
                  onClick={() => setActiveFacultyTab(fac)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft scale-102"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {fac}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Structured Grouped Course Catalog Grid */}
        {universityCourses.length > 0 ? (
          Object.keys(groupedCourses).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedCourses).map(([facName, depts]) => (
                <div key={facName} className="space-y-6">
                  {/* Faculty Header (only render during search since tabs are hidden) */}
                  {searchQuery.trim() !== "" && (
                    <h4 className="font-display text-sm font-bold text-primary flex items-center gap-2 border-b pb-2">
                      <BookOpen className="h-4 w-4" /> {facName} Faculty
                    </h4>
                  )}
                  {Object.entries(depts).map(([deptName, courses]) => (
                    <div key={deptName} className="space-y-3">
                      <h5 className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest pl-1">
                        {deptName}
                      </h5>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {courses.map((c) => {
                          const isEligible = studentJambScore >= c.cutoff;
                          return (
                            <div
                              key={c.id}
                              className="rounded-2xl border bg-muted/15 p-4 hover:border-primary/20 hover:bg-muted/5 transition-all flex flex-col justify-between shadow-soft relative overflow-hidden group"
                            >
                              <div
                                className={`absolute left-0 top-0 h-full w-1 transition-all ${
                                  isEligible ? "bg-success/50 group-hover:bg-success" : "bg-warning/40 group-hover:bg-warning"
                                }`}
                              />
                              <div className="pl-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="font-semibold text-sm text-foreground leading-snug">{c.name}</p>
                                  <Badge
                                    tone={isEligible ? "success" : "default"}
                                  >
                                    UTME Cutoff: {c.cutoff}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                                  <span>{c.duration}</span>
                                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                  <span>{c.faculty}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                  {c.description}
                                </p>
                              </div>
                              <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t pl-1">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                  {c.tuition || uni.tuition}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCourseId(c.id);
                                    setStep(1);
                                    setIsOpen(true);
                                  }}
                                  className="h-8 rounded-lg text-xs"
                                >
                                  Apply Now
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/10">
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground animate-pulse mb-3" />
              <p className="text-sm font-semibold text-foreground">No matching programs found</p>
              <p className="text-xs text-muted-foreground mt-1">Try typing a different course name or clear the search query.</p>
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No program lists currently populated for this institution.</p>
        )}
      </div>

      <Button
        className="bg-gradient-primary w-full md:w-auto"
        onClick={() => {
          if (universityCourses.length > 0) {
            setSelectedCourseId(universityCourses[0].id);
          }
          setStep(1);
          setIsOpen(true);
        }}
      >
        Apply now
      </Button>

      {/* Application Wizard Modal Dialog overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border bg-card p-6 shadow-elegant flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">ADMISSION APPLICATION</p>
                  <h3 className="font-display text-xl font-bold text-foreground truncate max-w-sm">{uni.name}</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Steps Indicators */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1 flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                    </div>
                    {s < 3 && (
                      <div className={`flex-1 h-0.5 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Content Panel */}
              <div className="min-h-56">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Academic Program</label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm"
                      >
                        {universityCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.faculty})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCourse && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border p-4 bg-muted/30 space-y-3"
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Required Cut-off Mark</span>
                          <span className="font-semibold">{selectedCourse.cutoff}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Your JAMB Score</span>
                          <span className="font-semibold">{studentJambScore}</span>
                        </div>

                        {/* Cutoff warning panel */}
                        <div className="pt-2 border-t flex gap-3">
                          {isCutoffMet ? (
                            <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs font-medium text-success w-full">
                              <Check className="h-4 w-4 shrink-0" />
                              <span>Eligible! Your score exceeds the cutoff minimum requirements.</span>
                            </div>
                          ) : (
                            <div className="flex gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs font-medium text-warning w-full">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>
                                Your score is below {selectedCourse.cutoff}. You may still apply, but admissions chance is lower.
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Attach Locker Documents
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Select supporting files to submit along with your university application.
                    </p>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {userDocs && userDocs.length > 0 ? (
                        userDocs.map((doc) => {
                          const checked = selectedDocs.includes(doc.url);
                          return (
                            <div
                              key={doc.id}
                              onClick={() => toggleDoc(doc.url)}
                              className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer hover:bg-accent transition-all ${
                                checked ? "border-primary bg-primary/5" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm font-medium truncate max-w-xs">{doc.name}</span>
                              </div>
                              <div
                                className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                                  checked ? "bg-primary border-primary text-primary-foreground" : "border-muted"
                                }`}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border border-dashed p-4 text-center">
                          <p className="text-xs text-muted-foreground mb-2">No files in your locker yet.</p>
                          <Link
                            to="/documents"
                            className="inline-flex items-center justify-center rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium h-9 px-3 transition-colors text-center"
                          >
                            Upload Results
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border p-4 bg-muted/40 text-center">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Admission Match Probability
                      </p>
                      <h4 className="font-display text-4xl font-bold gradient-text mt-1">
                        {selectedCourse
                          ? studentJambScore >= selectedCourse.cutoff
                            ? `${Math.min(98, 85 + Math.round((studentJambScore - selectedCourse.cutoff) * 0.8))}%`
                            : `${Math.max(30, 85 - Math.round((selectedCourse.cutoff - studentJambScore) * 1.5))}%`
                          : "85%"}
                      </h4>
                    </div>

                    <div className="rounded-xl border p-4 space-y-2 text-sm bg-card">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">University</span>
                        <span className="font-medium text-right truncate max-w-xs">{uni.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Program</span>
                        <span className="font-medium text-right">{selectedCourse?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attached Files</span>
                        <span className="font-medium text-right">
                          {selectedDocs.length} file(s) linked
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                {step > 1 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    className="bg-gradient-primary gap-1"
                    disabled={!selectedCourseId}
                    onClick={() => setStep(step + 1)}
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="bg-gradient-primary"
                    disabled={isSubmitting}
                    onClick={handleApplySubmit}
                  >
                    {isSubmitting ? "Submitting..." : "Confirm Application"}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
