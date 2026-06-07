import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Search, Wallet, Calendar, Trophy, ChevronRight, RotateCcw } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton, EmptyState, ErrorAlert } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getScholarships } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/scholarships")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Scholarships | WeBAR" }] }),
  component: () => <AppLayout><Scholarships /></AppLayout>,
});

function Countdown({ deadline }: { deadline: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date(deadline).getTime() - Date.now();
      if (d < 0) return setText("Closed");
      const days = Math.floor(d / 86400000);
      const hrs = Math.floor((d % 86400000) / 3600000);
      setText(`${days}d ${hrs}h left`);
    };
    tick();
    const i = setInterval(tick, 60000);
    return () => clearInterval(i);
  }, [deadline]);
  return <Badge tone={text === "Closed" ? "destructive" : "warning"}><Calendar className="mr-1 h-3 w-3" />{text}</Badge>;
}

type Quiz = {
  jambBand: "below_200" | "200_249" | "250_279" | "280_plus";
  field: "STEM" | "Medicine" | "Business" | "Arts" | "Engineering";
  needBased: "yes" | "no";
  level: "secondary" | "year1" | "year2_plus";
};

const QUIZ_STEPS: {
  key: keyof Quiz;
  question: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "jambBand",
    question: "What's your JAMB score range?",
    options: [
      { value: "below_200", label: "Below 200" },
      { value: "200_249", label: "200 – 249" },
      { value: "250_279", label: "250 – 279" },
      { value: "280_plus", label: "280+" },
    ],
  },
  {
    key: "field",
    question: "Which field are you targeting?",
    options: [
      { value: "STEM", label: "Sciences / Tech" },
      { value: "Engineering", label: "Engineering" },
      { value: "Medicine", label: "Medicine" },
      { value: "Business", label: "Business" },
      { value: "Arts", label: "Arts / Humanities" },
    ],
  },
  {
    key: "needBased",
    question: "Do you require need-based support?",
    options: [
      { value: "yes", label: "Yes. Financial aid important" },
      { value: "no", label: "No. Merit only is fine" },
    ],
  },
  {
    key: "level",
    question: "Where are you in your education?",
    options: [
      { value: "secondary", label: "Secondary / Pre-uni" },
      { value: "year1", label: "Year 1" },
      { value: "year2_plus", label: "Year 2+" },
    ],
  },
];

type Scholarship = { id: string; name: string; amount: string; deadline: string; eligibility: string[]; sponsor: string; category: string };

function scoreScholarship(s: Scholarship, q: Quiz): number {
  let score = 50;
  // JAMB matching
  const minScore = s.eligibility.find((e) => /JAMB/i.test(e))?.match(/\d+/)?.[0];
  if (minScore) {
    const min = Number(minScore);
    const userMin = q.jambBand === "below_200" ? 180 : q.jambBand === "200_249" ? 220 : q.jambBand === "250_279" ? 265 : 290;
    score += userMin >= min ? 25 : -20;
  } else score += 5;
  // Field
  if (q.field === "STEM" && (s.category === "STEM" || s.category === "Tech")) score += 15;
  if (q.field === "Engineering" && s.eligibility.some((e) => /Engineering/i.test(e))) score += 20;
  if (q.field === "Medicine" && s.eligibility.some((e) => /Medic/i.test(e))) score += 25;
  if (q.field === "Business" && (s.category === "Need" || s.sponsor.includes("MTN"))) score += 5;
  // Need-based
  if (q.needBased === "yes" && s.category === "Need") score += 10;
  if (q.needBased === "no" && s.category === "Merit") score += 8;
  // Level
  if (q.level === "year2_plus" && s.eligibility.some((e) => /Year 2/i.test(e))) score += 10;
  return Math.max(20, Math.min(99, score));
}

function Scholarships() {
  const { data, loading, error, refresh } = useApi(getScholarships);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [quizOpen, setQuizOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Quiz>>({});
  const [submitted, setSubmitted] = useState<Quiz | null>(null);

  const cats = ["All", "Merit", "STEM", "Need", "Tech"];

  const enriched = useMemo(() => {
    const list = (data ?? [])
      .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
      .filter((s) => (cat === "All" ? true : s.category === cat));
    if (!submitted) return list.map((s) => ({ ...s, match: undefined as number | undefined }));
    return list
      .map((s) => ({ ...s, match: scoreScholarship(s, submitted) }))
      .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
  }, [data, q, cat, submitted]);

  const answerCurrent = (val: string) => {
    const key = QUIZ_STEPS[step].key;
    const next = { ...answers, [key]: val };
    setAnswers(next);
    if (step === QUIZ_STEPS.length - 1) {
      setSubmitted(next as Quiz);
      setQuizOpen(false);
    } else {
      setStep(step + 1);
    }
  };

  const restartQuiz = () => {
    setStep(0);
    setAnswers({});
    setSubmitted(null);
    setQuizOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Scholarships" subtitle="Funding opportunities matched to your profile." />

      {error && (
        <ErrorAlert
          title="Failed to load scholarships"
          message={error.message || "A connection problem occurred. Please check your internet connection."}
          onRetry={refresh}
        />
      )}

      {/* Eligibility finder banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border bg-gradient-hero p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-semibold">Scholarship Finder</p>
              <p className="text-xs text-muted-foreground">
                {submitted
                  ? "Your answers are powering match scores below."
                  : "Answer 4 quick questions to see personalized match scores."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {submitted && (
              <Button variant="outline" size="sm" onClick={restartQuiz} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Retake
              </Button>
            )}
            {!submitted && (
              <Button size="sm" className="bg-gradient-primary" onClick={() => { setStep(0); setAnswers({}); setQuizOpen(true); }}>
                Find my matches <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scholarships..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)}>{c}</Button>
          ))}
        </div>
      </div>

      {loading && <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div>}

      {!loading && !error && enriched.length === 0 && (
        <EmptyState icon={Wallet} title="No scholarships match your filters" hint="Try a different category." />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {enriched.map((s, i) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone="primary">{s.category}</Badge>
                {s.match !== undefined && (
                  <Badge tone={s.match >= 80 ? "success" : s.match >= 60 ? "warning" : "destructive"}>
                    {s.match}% match
                  </Badge>
                )}
              </div>
            </div>
            <h3 className="font-display text-base font-semibold">{s.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{s.sponsor}</p>
            <p className="mt-3 font-display text-xl font-bold gradient-text">{s.amount}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.eligibility.map((e) => <Badge key={e}>{e}</Badge>)}
            </div>
            <div className="mt-auto flex items-center justify-between pt-4">
              <Countdown deadline={s.deadline} />
              <Button size="sm" className="bg-gradient-primary">Apply</Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quiz modal */}
      <AnimatePresence>
        {quizOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setQuizOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-elegant"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Step {step + 1} of {QUIZ_STEPS.length}
                </p>
                <button onClick={() => setQuizOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-gradient-primary"
                  animate={{ width: `${((step + 1) / QUIZ_STEPS.length) * 100}%` }}
                />
              </div>
              <h3 className="font-display text-lg font-semibold">{QUIZ_STEPS[step].question}</h3>
              <div className="mt-4 space-y-2">
                {QUIZ_STEPS[step].options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => answerCurrent(o.value)}
                    className="flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span>{o.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
