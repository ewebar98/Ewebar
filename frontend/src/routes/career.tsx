import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { Compass, Briefcase, Lightbulb, TrendingUp, ArrowRight, Send } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton, ErrorAlert } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getProfile, BACKEND_URL } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/career")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Career Guidance | WeBAR" }] }),
  component: () => <AppLayout><Career /></AppLayout>,
});

// Career paths are general Nigerian tech/professional landscape data — not "fake user data"
const careerPaths = [
  { title: "AI/ML Engineer", demand: "High", salary: "₦8M – ₦24M", icon: Lightbulb, skills: ["Python", "Math", "Statistics"], field: "Technology" },
  { title: "Software Engineer", demand: "Very High", salary: "₦6M – ₦18M", icon: Briefcase, skills: ["JS/TS", "Algorithms", "System Design"], field: "Technology" },
  { title: "Data Scientist", demand: "High", salary: "₦7M – ₦20M", icon: TrendingUp, skills: ["SQL", "Python", "Stats"], field: "Technology" },
  { title: "Product Designer", demand: "Growing", salary: "₦5M – ₦15M", icon: Compass, skills: ["Figma", "Research", "Empathy"], field: "Design" },
];

function Career() {
  const { user } = useAuth();
  const { data: profile, loading: profileLoading, error: profileErr, refresh: refreshProfile } = useApi("getProfile", getProfile);
  const [interest, setInterest] = useState("");
  const [guidance, setGuidance] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  // Compute a basic match score for each path based on user interests
  const withMatch = careerPaths.map((p) => {
    if (!profile?.interests || profile.interests.length === 0) return { ...p, match: null };
    const interestKeywords = profile.interests.map((i: string) => i.toLowerCase());
    const pathKeywords = [...p.skills, p.title, p.field].map((k: string) => k.toLowerCase());
    const matches = interestKeywords.filter((k: string) => pathKeywords.some((pk: string) => pk.includes(k) || k.includes(pk)));
    const matchPct = Math.min(95, 50 + matches.length * 15 + (profile.jambScore > 250 ? 10 : 0));
    return { ...p, match: matches.length > 0 ? matchPct : null };
  }).sort((a, b) => (b.match ?? 0) - (a.match ?? 0));

  const topMatch = withMatch[0];

  const handleAskAI = async () => {
    if (!interest.trim()) return;
    setAsking(true);
    setGuidance(null);
    try {
      const token = localStorage.getItem("webar.token");
      const res = await fetch(`${BACKEND_URL}/api/ai/career-guidance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ interest: interest.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "AI request failed");
      const content = json.data?.content || json.data || "No guidance available.";
      setGuidance(typeof content === "string" ? content : JSON.stringify(content));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get AI guidance");
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Career guidance" subtitle="Recommended career paths based on your profile." />

      {profileErr && (
        <ErrorAlert
          title="Failed to load career profile data"
          message={profileErr.message || "A connection problem occurred. Please check your internet connection."}
          onRetry={refreshProfile}
        />
      )}

      {/* Hero banner - dynamic based on real profile */}
      <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8">
        {profileLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold">
              {topMatch.match && topMatch.match > 60
                ? `Hi ${firstName}, your top career match is ${topMatch.title}`
                : `Hi ${firstName}, explore career paths in Nigeria's tech ecosystem`}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {profile?.interests && profile.interests.length > 0
                ? `Based on your interests in ${profile.interests.slice(0, 3).join(", ")}.`
                : "Complete your profile to get personalized career matches."}
            </p>
            {topMatch.match && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="primary">High Demand</Badge>
                <Badge tone="success">{topMatch.match}% Match</Badge>
                <Badge tone="warning">Top Field in Africa</Badge>
              </div>
            )}
          </>
        )}
      </div>

      {/* Career path cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {withMatch.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border bg-card p-5 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              {p.match !== null && (
                <span className="font-display text-2xl font-bold gradient-text">{p.match}%</span>
              )}
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{p.title}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.skills.map((s) => <Badge key={s}>{s}</Badge>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Demand</p><p className="font-medium">{p.demand}</p></div>
              <div><p className="text-xs text-muted-foreground">Salary</p><p className="font-medium">{p.salary}</p></div>
            </div>
            <button
              onClick={() => setInterest(p.title)}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Learn more about this path <ArrowRight className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Career Guidance section */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="mb-3 font-display text-lg font-semibold">Ask about any career</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Get specific guidance on career paths, required courses, and top universities in Nigeria.
        </p>
        <div className="flex gap-2">
          <Input
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. Medicine, Cybersecurity, Finance..."
            onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
          />
          <Button onClick={handleAskAI} disabled={asking || !interest.trim()} className="bg-gradient-primary gap-2">
            {asking ? "Asking..." : <><Send className="h-4 w-4" /> Ask Counselor</>}
          </Button>
        </div>
        {guidance && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {guidance.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
