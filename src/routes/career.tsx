import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Compass, Briefcase, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge } from "@/components/ui-kit";

export const Route = createFileRoute("/career")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Career Guidance — Intellipath" }] }),
  component: () => <AppLayout><Career /></AppLayout>,
});

const paths = [
  { title: "AI/ML Engineer", match: 92, demand: "High", salary: "₦8M – ₦24M", icon: Lightbulb, skills: ["Python", "Math", "Statistics"] },
  { title: "Software Engineer", match: 88, demand: "Very High", salary: "₦6M – ₦18M", icon: Briefcase, skills: ["JS/TS", "Algorithms", "System Design"] },
  { title: "Data Scientist", match: 84, demand: "High", salary: "₦7M – ₦20M", icon: TrendingUp, skills: ["SQL", "Python", "Stats"] },
  { title: "Product Designer", match: 76, demand: "Growing", salary: "₦5M – ₦15M", icon: Compass, skills: ["Figma", "Research", "Empathy"] },
];

function Career() {
  return (
    <div className="space-y-6">
      <PageHeader title="Career guidance" subtitle="AI-mapped career paths based on your strengths." />
      <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8">
        <h2 className="font-display text-2xl font-bold">Your top career match: AI/ML Engineer</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">Strong fit based on your math results, problem-solving aptitude, and stated interest in AI.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="primary">High Demand</Badge>
          <Badge tone="success">92% Match</Badge>
          <Badge tone="warning">Top 10 in Africa</Badge>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {paths.map((p, i) => (
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
              <span className="font-display text-2xl font-bold gradient-text">{p.match}%</span>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{p.title}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.skills.map((s) => <Badge key={s}>{s}</Badge>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Demand</p><p className="font-medium">{p.demand}</p></div>
              <div><p className="text-xs text-muted-foreground">Salary</p><p className="font-medium">{p.salary}</p></div>
            </div>
            <button className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Explore path <ArrowRight className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
