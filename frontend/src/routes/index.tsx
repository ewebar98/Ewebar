import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, GraduationCap, Wallet, Brain, FileScan, ArrowRight,
  CheckCircle2, Star, Users, Trophy, Globe2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WeBAR | University Admission Platform" },
      { name: "description", content: "Discover universities, get personalized admission recommendations, and plan your future career." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: GraduationCap, title: "Admission Recommendations", desc: "Intelligent matching for your scores and interests.", tone: "primary" },
  // { icon: Wallet, title: "Scholarship Discovery", desc: "Find scholarships you actually qualify for, with countdowns and requirements.", tone: "success" },
  { icon: Brain, title: "Career Guidance", desc: "A 24/7 mentor that maps your strengths to careers and degrees.", tone: "warning" },
  { icon: FileScan, title: "Result Upload", desc: "Upload JAMB or WAEC results for automatic subject extraction.", tone: "primary" },
] as const;

const toneMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
};

const stats = [
  { icon: Users, value: "18,400+", label: "Students guided" },
  { icon: GraduationCap, value: "184", label: "Universities" },
  // { icon: Trophy, value: "312", label: "Scholarships" },
  { icon: Globe2, value: "12", label: "Countries" },
];

const testimonials = [
  { name: "Tunde A.", role: "UNILAG, Computer Science", quote: "WeBAR matched me with three programs I'd never considered. I got into my top choice." },
  { name: "Aisha B.", role: "Covenant, Engineering", quote: "The WeBAR advisor tool alone saved me months of searching." },
  { name: "Chinedu O.", role: "OAU, Medicine", quote: "The AI assistant felt like talking to a real counselor. Confidence-building and honest." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <motion.div
          aria-hidden
          className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          aria-hidden
          className="absolute -right-24 top-48 h-72 w-72 rounded-full bg-success/30 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="h-4" />
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl"
            >
              Find your <span className="gradient-text">perfect university</span> with intelligent guidance.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg"
            >
              WeBAR analyses your results, interests, and goals to recommend programs that fit you.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-success" />
              <span>In partnership with <strong>LASUSTECH</strong> for direct admissions matching</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground h-11 px-8 text-sm font-semibold shadow-elegant hover:opacity-95 transition-all"
              >
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link
                to="/assistant"
                className="inline-flex items-center justify-center rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 text-sm font-medium transition-all"
              >
                Consult the assistant
              </Link>
            </motion.div>
            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" /> No credit card
              <CheckCircle2 className="h-4 w-4 text-success" /> Free for students
            </div>
          </div>

          {/* Hero illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl border bg-card/80 p-6 shadow-elegant backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
                    <GraduationCap className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <p className="text-sm font-semibold">Match Report</p>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">Live</span>
              </div>
              <div className="space-y-3">
                {[
                  { uni: "University of Lagos", course: "Computer Science", match: 94 },
                  { uni: "Covenant University", course: "Computer Science", match: 88 },
                  { uni: "OAU", course: "Mech. Engineering", match: 82 },
                ].map((r, i) => (
                  <motion.div
                    key={r.uni}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="rounded-xl border bg-background p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{r.uni}</p>
                        <p className="text-xs text-muted-foreground">{r.course}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-primary">{r.match}%</p>
                        <p className="text-xs text-muted-foreground">match</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${r.match}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                        className="h-full bg-gradient-primary"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Everything you need to choose well.</h2>
          <p className="mt-3 text-muted-foreground">Built around the real decisions students face.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border bg-card p-6 shadow-soft"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneMap[f.tone]}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-4 rounded-2xl border bg-background p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Loved by ambitious students.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border bg-card p-6 shadow-soft"
            >
              <div className="mb-3 flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-sm text-foreground/80">"{t.quote}"</p>
              <div className="mt-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center text-primary-foreground shadow-elegant md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Your future university is one click away.</h2>
          <p className="mt-3 text-primary-foreground/85">Create a free account and get your first recommendations today.</p>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 h-11 px-8 text-sm font-semibold shadow-soft transition-all"
          >
            Get started free <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
