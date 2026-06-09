import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Skeleton, Badge, ErrorAlert } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getApplications, getApplicationMessages, sendApplicationMessage, markApplicationMessagesAsRead, confirmOfferAcceptance, Message } from "@/services/api";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Loader2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/applications")({
  beforeLoad: requireRole("student"),
     head: () => ({ meta: [{ title: "Applications — WeBAR" }] }),
  component: () => <AppLayout><Applications /></AppLayout>,
});

// Live countdown timer showing hours:minutes:seconds until offer expires
function OfferCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(h < 12);
      setTimeLeft(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <div className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${
      urgent ? "text-destructive animate-pulse" : "text-amber-500"
    }`}>
      <Clock className="h-3 w-3" />
      <span>{timeLeft}</span>
    </div>
  );
}

function Applications() {
  const { data, loading, error, refresh } = useApi("getApplications", getApplications);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeApp = data?.find((a) => a.id === activeAppId);

  // Poll for messages and mark as read when chat is open
  useEffect(() => {
    if (!activeAppId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await getApplicationMessages(activeAppId);
        if (isMounted) {
          setMessages(msgs);
          setLoadingMessages(false);
        }
      } catch (err: any) {
        console.error("Failed to load chat messages:", err);
      }
    };

    fetchMessages();
    markApplicationMessagesAsRead(activeAppId).catch(console.error);
    
    // Clear list badges when drawer is opened
    refresh();

    // 4-second lightweight database polling
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [activeAppId]);

  // Smooth scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppId || !newMessageText.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const sentMsg = await sendApplicationMessage(activeAppId, newMessageText.trim());
      setMessages((prev) => [...prev, sentMsg]);
      setNewMessageText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Applications" subtitle="Track every program you've applied to." />
      {error && (
        <ErrorAlert
          title="Failed to load applications"
          message={error.message || "A connection problem occurred. Please check your internet connection."}
          onRetry={refresh}
        />
      )}
      {loading && <Skeleton className="h-64" />}
      
      {!loading && !error && (!data || data.length === 0) && (
        <div className="rounded-2xl border p-12 text-center bg-card shadow-soft">
          <MessageCircle className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-lg font-bold">No applications found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            You haven't submitted any admissions applications yet. Explore universities and file an application to begin.
          </p>
        </div>
      )}

      {!loading && data && data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                <th className="px-5 py-3">University</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Probability</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-3 font-semibold text-foreground">{a.university}</td>
                  <td className="px-5 py-3 text-muted-foreground font-medium">{a.course}</td>
                  <td className="px-5 py-3">
                    <Badge tone={a.status === "Accepted" ? "success" : a.status === "Rejected" ? "destructive" : a.status === "Offered" ? "warning" : a.status === "Reviewed" ? "primary" : "warning"}>
                      {a.status}
                    </Badge>
                    {a.status === "Offered" && a.offerExpiresAt && (
                      <OfferCountdown expiresAt={a.offerExpiresAt} />
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-gradient-primary" style={{ width: `${a.probability}%` }} />
                      </div>
                      <span className="font-semibold text-xs">{a.probability}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{a.submitted}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {a.status === "Offered" && (
                        <Button
                          size="sm"
                          className="rounded-lg gap-1.5 text-xs bg-gradient-primary"
                          onClick={async () => {
                            if (!window.confirm("Confirm acceptance of this offer?")) return;
                            try {
                              await confirmOfferAcceptance(a.id);
                              toast.success("Offer accepted. Congratulations!");
                              refresh();
                            } catch (err: any) {
                              toast.error(err.message || "Failed to accept offer");
                            }
                          }}
                        >
                          Accept Offer
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg gap-1.5 relative text-xs hover:border-primary/50 transition-all"
                        onClick={() => {
                          setActiveAppId(a.id);
                          setLoadingMessages(true);
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-primary" />
                        <span>Admissions Help</span>
                        {a.unreadMessagesCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-pulse shadow-sm">
                            {a.unreadMessagesCount}
                          </span>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Sliding Glassmorphic Help Chat Drawer */}
      <AnimatePresence>
        {activeApp && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
            {/* Click backdrop to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setActiveAppId(null)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 210 }}
              className="relative w-full max-w-md bg-card/98 backdrop-blur-md h-full shadow-elegant flex flex-col border-l z-10"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b p-5 bg-muted/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Admissions Live Help</span>
                  <h3 className="font-display text-sm font-bold text-foreground truncate max-w-[280px] mt-0.5">
                    {activeApp.course}
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[280px] mt-0.5">{activeApp.university}</p>
                </div>
                <button
                  onClick={() => setActiveAppId(null)}
                  className="rounded-full p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Message Stream Scrollbox */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/5">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground font-medium">Securing admissions connection...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-full animate-bounce">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold">No messages yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      Inquire about your application review status or discuss missing academic requirements directly with evaluators.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m, idx) => {
                      const isSelf = m.senderRole === "student";
                      const showDateDivider = idx === 0 || 
                        new Date(m.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
                      
                      return (
                        <div key={m.id} className="space-y-1">
                          {showDateDivider && (
                            <div className="flex justify-center my-4">
                              <span className="text-[9px] font-bold bg-muted px-2.5 py-1 rounded-full text-muted-foreground uppercase tracking-wider border border-border/40">
                                {new Date(m.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 shadow-soft text-xs ${
                              isSelf 
                                ? "bg-gradient-primary text-primary-foreground rounded-br-none" 
                                : "bg-card text-foreground rounded-bl-none border border-border/50"
                            }`}>
                              {!isSelf && (
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="font-extrabold text-[9px] text-primary uppercase tracking-wide">Admissions Officer</span>
                                  <span className="text-[7px] font-bold bg-primary/10 text-primary px-1 py-0.5 rounded uppercase">Staff</span>
                                </div>
                              )}
                              <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] font-medium ${
                                isSelf ? "text-primary-foreground/70" : "text-muted-foreground/70"
                              }`}>
                                <span>
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isSelf && (
                                  <span className="font-extrabold text-[8px] uppercase tracking-wide">
                                    {m.read ? "Read" : "Sent"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Textarea Composer Panel */}
              <form onSubmit={handleSendMessage} className="border-t p-4 bg-card">
                <div className="flex gap-2">
                  <textarea
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type an admissions inquiry..."
                    maxLength={1000}
                    className="flex-1 max-h-24 min-h-[44px] rounded-xl border bg-muted/30 px-3.5 py-2 text-xs focus-visible:outline-none focus:bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none font-medium"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={sendingMessage || !newMessageText.trim()}
                    className="rounded-xl px-3 bg-gradient-primary shrink-0 self-end h-[44px] w-[44px]"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    Admissions Support
                  </span>
                  <span>{newMessageText.length}/1000</span>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
