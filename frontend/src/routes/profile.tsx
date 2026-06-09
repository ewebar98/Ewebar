import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ScanLine, FilePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getProfile, ocrExtractResult, updateProfile, getUniversities, getUniversityById } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NIGERIAN_STATES, STATE_LGA_MAPPING } from "@/constants/nigerianStatesLgas";

const ProfileRouteComponent = () => (
  <AppLayout>
    <Profile />
  </AppLayout>
);

export const Route = createFileRoute("/profile")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Profile | WeBAR" }] }),
  component: ProfileRouteComponent,
});

function Profile() {
  const { data, loading, error } = useApi("getProfile", getProfile);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Awaited<ReturnType<typeof ocrExtractResult>> | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch LASUSTECH courses dynamically
  const { data: schools } = useApi("getUniversities", getUniversities);
  const lasustechUni = schools?.find(
    (u) => u.name.includes("Lagos State University of Science") || u.name.includes("LASUSTECH")
  );

  const { data: lasustechData } = useApi(
    "getLasustech",
    () => (lasustechUni ? getUniversityById(lasustechUni.id) : Promise.resolve(null)),
    [lasustechUni?.id]
  );

  const lasustechCourses = (lasustechData as any)?.courses || [];

  // Local form state
  const [form, setForm] = useState({
    jambScore: "",
    bio: "",
    preferredUniversities: "",
    stateOfOrigin: "",
    lga: "",
    preferredCourse: "",
  });

  const initializedRef = useRef(false);

  // Sync form when data loads (using useEffect to fix infinite loop, only once)
  useEffect(() => {
    if (data && !initializedRef.current) {
      setForm({
        jambScore: data.jambScore ? String(data.jambScore) : "",
        bio: data.bio || "",
        preferredUniversities: (data.preferredUniversities || []).join(", "),
        stateOfOrigin: data.stateOfOrigin || "",
        lga: data.lga || "",
        preferredCourse: data.preferredCourse || "",
      });
      initializedRef.current = true;
    }
  }, [data]);

  const handleResultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      const res = await ocrExtractResult(file);
      setExtracted(res);
      if (res.score > 0) {
        toast.success(`Extracted ${res.examType} result with score of ${res.score}`);
      } else {
        toast.info(`Document uploaded. OCR extraction is processing.`);
      }
    } catch {
      toast.error("Failed to process the document");
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updateProfile({
        name: data.name,
        jambScore: form.jambScore ? Number(form.jambScore) : 0,
        interests: data.interests,
        state: data.state,
        bio: form.bio,
        stateOfOrigin: form.stateOfOrigin,
        lga: form.lga,
        preferredCourse: form.preferredCourse,
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-soft">
        <p className="font-medium text-destructive">Failed to load profile</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (loading || !data) return <Skeleton className="h-96 w-full" />;

  // Compute initials from actual name
  const initials = data.name
    ? data.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <div className="space-y-6">
      <PageHeader title="Your profile" subtitle="Personal, academic, and preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground">
              {initials}
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{data.name || "-"}</h3>
            <p className="text-sm text-muted-foreground">{data.email || "-"}</p>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            {data.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{data.phone}</span></div>}
            {data.dob && <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span>{data.dob}</span></div>}
            {data.state && <div className="flex justify-between"><span className="text-muted-foreground">State</span><span>{data.state}</span></div>}
            {data.jambScore > 0 && <div className="flex justify-between"><span className="text-muted-foreground">JAMB</span><span className="font-semibold text-primary">{data.jambScore}</span></div>}
          </div>
          {data.interests && data.interests.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {data.interests.map((interest: string) => <Badge key={interest} tone="primary">{interest}</Badge>)}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Intelligent upload */}
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Intelligent Result Upload</h3>
            </div>
            <p className="text-sm text-muted-foreground">Upload your JAMB or WAEC/NECO result. Subjects and grades will be extracted automatically.</p>
            <label className="mt-4 inline-flex">
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleResultUpload} />
              <Button asChild className="bg-gradient-primary">
                <span>{extracting ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Extracting...</> : <><FilePlus className="mr-1 h-4 w-4" /> Upload result</>}</span>
              </Button>
            </label>

            {extracted && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between">
                  <Badge tone="success">{extracted.examType} extracted</Badge>
                  {extracted.score > 0 && <span className="font-display text-xl font-bold gradient-text">{extracted.score}</span>}
                </div>
                {extracted.subjects && extracted.subjects.length > 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {extracted.subjects.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                        <span>{s.name}</span>
                        <Badge tone="success">{s.grade}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Document received. Full extraction requires server-side OCR processing.</p>
                )}
              </motion.div>
            )}
          </div>

          {/* Academic info */}
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-display text-lg font-semibold">Academic information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>JAMB Score</Label>
                <Input
                  value={form.jambScore}
                  onChange={(e) => setForm((f) => ({ ...f, jambScore: e.target.value }))}
                  type="number"
                  min={0}
                  max={400}
                  placeholder="e.g. 268"
                />
              </div>

              <div className="space-y-2">
                <Label>State of Origin</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.stateOfOrigin}
                  onChange={(e) => setForm((f) => ({ ...f, stateOfOrigin: e.target.value, lga: "" }))}
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>LGA of Origin</Label>
                {form.stateOfOrigin ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={form.lga}
                    onChange={(e) => setForm((f) => ({ ...f, lga: e.target.value }))}
                  >
                    <option value="">Select LGA</option>
                    {(STATE_LGA_MAPPING[form.stateOfOrigin] || []).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value=""
                    disabled
                  >
                    <option value="">Select state first</option>
                  </select>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Preferred Course of Study (LASUSTECH)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.preferredCourse}
                  onChange={(e) => setForm((f) => ({ ...f, preferredCourse: e.target.value }))}
                >
                  <option value="">Select Course</option>
                  {lasustechCourses.length > 0 ? (
                    (Array.from(new Set(lasustechCourses.map((c: any) => c.name))).sort() as string[]).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value="" disabled>No courses available</option>
                  )}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>A short Bio explaining your career interests and skills</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Preferred universities (comma-separated)</Label>
                <Input
                  value={form.preferredUniversities}
                  onChange={(e) => setForm((f) => ({ ...f, preferredUniversities: e.target.value }))}
                  placeholder="e.g. UNILAG, Covenant, OAU"
                />
              </div>
            </div>
            <Button
              className="mt-4 bg-gradient-primary gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save changes</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
