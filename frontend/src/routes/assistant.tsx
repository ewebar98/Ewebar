coimport { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Send, GraduationCap, RefreshCcw, User as UserIcon, Download, Copy, Mic } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { chatWithAssistant } from "@/services/api";

export const Route = createFileRoute("/assistant")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Assistant | Intellipath" }] }),
  component: () => <AppLayout><Assistant /></AppLayout>,
});

type Msg = { id: string; role: "user" | "assistant"; content: string; ts: number };

const STARTER_SUGGESTIONS = [
  "Best CS schools for me?",
  "How can I improve my JAMB score?",
  "Career paths in AI",
  "Compare UNILAG vs Covenant",
  "What courses match my profile?",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function Assistant() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: "assistant",
      content: `Hi ${firstName}! I'm your intelligent admission counselor. Ask me about programs, JAMB strategy, or career paths.`,
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-NG";
      
      rec.onstart = () => {
        setListening(true);
        toast.info("Listening... Speak now!");
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
          toast.success("Voice capture successful!");
        }
      };
      
      rec.onerror = (event: any) => {
        console.error("Speech Error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied.");
        } else {
          toast.error("Speech error. Please try again.");
        }
        setListening(false);
      };
      
      rec.onend = () => {
        setListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

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

    try {
      // Build history (exclude the last user message we just added)
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await chatWithAssistant(history, content);
      const replyMsg: Msg = { id: uid(), role: "assistant", content: reply.content, ts: Date.now() };
      setMessages((m) => [...m, replyMsg]);
    } catch (err) {
      const errorMsg: Msg = {
        id: uid(),
        role: "assistant",
        content: "Sorry, I couldn't connect to the assistant right now. Please try again in a moment.",
        ts: Date.now(),
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setTyping(false);
    }
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
    a.download = `WeBAR-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported");
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const dynamicSuggestions = lastAssistant?.content.toLowerCase().includes("unilag")
    ? ["What courses does UNILAG offer?", "Tuition fees breakdown", "Hostel options"]
    : lastAssistant?.content.toLowerCase().includes("jamb")
    ? ["What subjects should I focus on?", "Best JAMB prep resources", "What score do I need?"]
    : STARTER_SUGGESTIONS;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Assistant" subtitle="Your 24/7 AI admission counselor." />
        <div className="mb-6 flex flex-wrap gap-2">
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
        <div className="relative flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={typing ? "Assistant is responding..." : listening ? "Listening... Speak now!" : "Ask anything about admissions..."}
            disabled={typing}
            className="pr-12"
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={typing}
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
              listening 
                ? "bg-destructive text-destructive-foreground animate-pulse" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Voice to Text"
          >
            {listening ? (
              <Mic className="h-4 w-4 animate-bounce" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </div>
        <Button type="submit" className="bg-gradient-primary" disabled={typing || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
