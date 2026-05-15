import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Send, GraduationCap, RefreshCcw, User as UserIcon, Download, Copy, History } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockChatHistory } from "@/utils/mockData";

export const Route = createFileRoute("/assistant")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Assistant | Intellipath" }] }),
  component: () => <AppLayout><Assistant /></AppLayout>,
});

type Msg = { id: string; role: "user" | "assistant"; content: string; ts: number };

const STARTER_SUGGESTIONS = [
  "Best CS schools for me?",
  "Scholarships I qualify for",
  "How can I improve my JAMB score?",
  "Career paths in AI",
  "Compare UNILAG vs Covenant",
];

// Mock "smart" replies — keyword matched, structured like a real LLM response.
function mockReply(message: string): string {
  const m = message.toLowerCase();
  if (/scholar/.test(m)) {
    return [
      "Based on your profile, here are 3 scholarships you qualify for:",
      "",
      "• **MTN Foundation Scholarship** : ₦600k, deadline Aug 15",
      "• **NNPC/Total National Merit** : ₦800k, deadline Jul 20",
      "• **Google Africa Developer** : Free training, deadline May 25",
      "",
      "Want me to draft your applications?",
    ].join("\n");
  }
  if (/jamb|score|improve/.test(m)) {
    return "Your JAMB score (268) is already in the top 12%. To push higher, focus on **English comprehension** (your weakest area) and practice 2 timed mock tests per week. I can build a 6-week study plan.";
  }
  if (/career|ai|future|path/.test(m)) {
    return "AI careers with strongest growth in Nigeria right now:\n\n1. **ML Engineer** : ₦8M–₦25M/yr\n2. **Data Scientist** : ₦6M–₦18M/yr\n3. **AI Product Manager** : ₦10M–₦22M/yr\n\nGiven your CS interest, the ML Engineer path aligns with 94% of your skill profile.";
  }
  if (/unilag|covenant|compare/.test(m)) {
    return "**UNILAG vs Covenant | quick compare:**\n\n• UNILAG: 94% match, ₦120k/yr, larger cohort, stronger research\n• Covenant: 88% match, ₦950k/yr, better mentorship, faster placement\n\nFor your profile, UNILAG edges out on cost-to-outcome. Covenant wins on industry network.";
  }
  if (/best|cs|school|university/.test(m)) {
    return "Your top 3 matches based on your JAMB score and interests:\n\n1. **University of Lagos : CS** (94% match)\n2. **Covenant University : CS** (88% match)\n3. **OAU : Mech. Engineering** (82% match)\n\nWant a deeper breakdown of any of these?";
  }
  return `Great question! Based on your profile (JAMB 268, CS interest), here's a focused take on "${message.slice(0, 60)}": I'd recommend exploring the **Recommendations** tab where I've matched 4 strong-fit programs. Want me to dive deeper into any specific area?`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: "assistant",
      content: "Hi Ada. I'm your intelligent admission counselor. Ask me about programs, scholarships, JAMB strategy, or careers. I learn from your profile in real time.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || typing) return;
    const userMsg: Msg = { id: uid(), role: "user", content, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate streaming-like delay (variable based on message length)
    const delay = 700 + Math.min(content.length * 25, 1500);
    await new Promise((r) => setTimeout(r, delay));

    const reply: Msg = { id: uid(), role: "assistant", content: mockReply(content), ts: Date.now() };
    setMessages((m) => [...m, reply]);
    setTyping(false);
  };

  const reset = () => {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: "Conversation cleared. What would you like to explore next?",
        ts: Date.now(),
      },
    ]);
    toast.success("Started a new chat");
  };

  const loadMockHistory = () => {
    setMessages(
      mockChatHistory.map((m) => ({ id: uid(), role: m.role, content: m.content, ts: Date.now() }))
    );
    toast.success("Loaded mock conversation");
  };

  const transcriptText = () =>
    messages
      .map((m) => `[${new Date(m.ts).toLocaleString()}] ${m.role === "user" ? "You" : "Assistant"}:\n${m.content}`)
      .join("\n\n");

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcriptText());
      toast.success("Transcript copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const exportTranscript = () => {
    const blob = new Blob([transcriptText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Intellipath-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported");
  };

  // Contextual follow-ups change based on last assistant message
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const dynamicSuggestions = lastAssistant?.content.toLowerCase().includes("scholarship")
    ? ["Draft my MTN application", "Show all eligible scholarships", "Deadline reminders"]
    : lastAssistant?.content.toLowerCase().includes("unilag")
    ? ["Tuition breakdown", "Hostel options", "Course curriculum"]
    : STARTER_SUGGESTIONS;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Assistant" subtitle="Your 24/7 admission counselor." />
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadMockHistory} className="gap-2">
            <History className="h-3.5 w-3.5" /> Load mock
          </Button>
          <Button variant="outline" size="sm" onClick={copyTranscript} className="gap-2">
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={exportTranscript} className="gap-2">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <RefreshCcw className="h-3.5 w-3.5" /> New chat
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border bg-card shadow-soft">
        <div className="mx-auto max-w-3xl space-y-4 p-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-primary">
                    <GraduationCap className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft ${
                    m.role === "user"
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.content.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
                {m.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3 shadow-soft">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-muted-foreground/60"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {dynamicSuggestions.map((s) => (
          <motion.button
            key={s}
            whileHover={{ y: -1 }}
            onClick={() => send(s)}
            disabled={typing}
            className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {s}
          </motion.button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="mt-3 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={typing ? "Assistant is responding..." : "Ask anything about admissions..."}
          disabled={typing}
        />
        <Button type="submit" className="bg-gradient-primary" disabled={typing || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
