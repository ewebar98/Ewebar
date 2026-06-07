import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Search, Eye, FileText, CheckCircle2, XCircle, Clock, Calendar, ShieldCheck, ChevronRight, X, MessageCircle, Send, Loader2 } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton, EmptyState } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import { getAdminApplications, updateApplicationStatus, AdminApplication, getApplicationMessages, sendApplicationMessage, markApplicationMessagesAsRead, Message, BACKEND_URL } from "@/services/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/admin/applications")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Admissions Evaluation — WeBAR" }] }),
  component: () => <AppLayout variant="admin"><EvaluateApplications /></AppLayout>,
});

function EvaluateApplications() {
  const { data: applications, loading, refresh } = useApi(getAdminApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);

  // Review decision states
  const [decisionStatus, setDecisionStatus] = useState<"pending" | "reviewed" | "accepted" | "rejected">("reviewed");
  const [evaluationNotes, setEvaluationNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Active drawer tab workspace
  const [activeTab, setActiveTab] = useState<"evaluation" | "chat">("evaluation");

  // Admissions support chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const filtered = (applications || []).filter((a) =>
    a.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.university.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenReview = (app: AdminApplication) => {
    setSelectedApp(app);
    setDecisionStatus(app.status);
    setEvaluationNotes("");
    setActiveTab("evaluation"); // Reset active workspace tab
  };

  const handleSaveDecision = async () => {
    if (!selectedApp) return;
    setIsSaving(true);
    try {
      await updateApplicationStatus(selectedApp.id, decisionStatus, evaluationNotes);
      toast.success("Application decision updated and logged!");
      setSelectedApp(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update application decision");
    } finally {
      setIsSaving(false);
    }
  };

  // Poll for messages in admin chat tab
  useEffect(() => {
    if (!selectedApp || activeTab !== "chat") {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await getApplicationMessages(selectedApp.id);
        if (isMounted) {
          setMessages(msgs);
          setLoadingMessages(false);
        }
      } catch (err) {
        console.error("Failed to fetch application messages in admin:", err);
      }
    };

    setLoadingMessages(true);
    fetchMessages();
    markApplicationMessagesAsRead(selectedApp.id).catch(console.error);

    // Refresh application list so badge updates immediately in background
    refresh();

    // 4-second lightweight database polling
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [selectedApp, activeTab]);

  // Smooth scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !newMessageText.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const sentMsg = await sendApplicationMessage(selectedApp.id, newMessageText.trim());
      setMessages((prev) => [...prev, sentMsg]);
      setNewMessageText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge tone="success"><CheckCircle2 className="mr-1 h-3 w-3" />Accepted</Badge>;
      case "rejected":
        return <Badge tone="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      case "reviewed":
        return <Badge tone="primary"><ShieldCheck className="mr-1 h-3 w-3" />Reviewed</Badge>;
      default:
        return <Badge tone="warning"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Admissions evaluation" subtitle="Review incoming student academic applications and transition admission statuses." />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search student or institution..."
          className="pl-9 rounded-xl"
        />
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && filtered.length === 0 && (
        <EmptyState icon={FileText} title="No applications found" hint="Waiting for student submissions." />
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Institution</th>
                <th className="px-5 py-3">Target Program</th>
                <th className="px-5 py-3">Score Matches</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-semibold text-foreground">{a.student.name}</p>
                      <p className="text-xs text-muted-foreground">{a.student.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.university.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{a.course.name}</p>
                      <p className="text-xs">{a.course.faculty} · {a.course.duration}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${a.matchScore >= 75 ? "bg-success" : "bg-warning"}`}
                          style={{ width: `${a.matchScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs">{a.matchScore}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{getStatusBadge(a.status)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {a.unreadMessagesCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-pulse shadow-sm">
                          {a.unreadMessagesCount}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg gap-1.5 hover:border-primary/50 transition-all"
                        onClick={() => handleOpenReview(a)}
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" /> Evaluate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out evaluation Drawer details */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
            {/* Backdrop click close */}
            <div className="absolute inset-0" onClick={() => setSelectedApp(null)} />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 210 }}
              className="relative w-full max-w-lg bg-card h-full shadow-elegant flex flex-col p-6 border-l z-10"
            >
              {/* Header drawer */}
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Application Evaluation Workspace</p>
                  <h3 className="font-display text-xl font-bold text-foreground mt-0.5">Review Submission</h3>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="rounded-full p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tab Navigation Menu */}
              <div className="flex border-b mb-6 select-none">
                <button
                  onClick={() => setActiveTab("evaluation")}
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                    activeTab === "evaluation"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Evaluation Workspace
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "chat"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Applicant Support Chat</span>
                  {selectedApp.unreadMessagesCount > 0 && (
                    <span className="h-4.5 w-4.5 flex items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground animate-pulse shadow-sm">
                      {selectedApp.unreadMessagesCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Drawer Content Body depending on selected workspace tab */}
              {activeTab === "evaluation" && (
                <div className="flex-1 overflow-y-auto space-y-4 mb-2 pr-1">
                  {/* Student overview */}
                  <div className="rounded-2xl border p-4 bg-muted/20">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Applicant Academic Profile</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="font-semibold">{selectedApp.student.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-semibold truncate">{selectedApp.student.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">JAMB Aggregate Score</p>
                        <p className="font-semibold">{selectedApp.student.jambScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">WAEC Average Grade</p>
                        <p className="font-semibold">{selectedApp.student.waecAggregate || "Not Uploaded"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Program Requirements Match</h4>
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="text-muted-foreground font-medium">Institution Course</span>
                      <span className="font-semibold text-foreground">{selectedApp.course.name} ({selectedApp.university.name})</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="text-muted-foreground font-medium">Required Course Cutoff</span>
                      <span className="font-semibold text-foreground">{selectedApp.course.cutoff}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="text-muted-foreground font-medium">Admissions Compatibility Match</span>
                      <span className={`font-bold ${selectedApp.matchScore >= 75 ? "text-success" : "text-warning"}`}>
                        {selectedApp.matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* Attached results documents */}
                  <div className="rounded-2xl border p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attached Credentials</h4>
                    {selectedApp.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedApp.documents.map((doc, idx) => (
                          <a
                            key={idx}
                            href={`${BACKEND_URL}${doc.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-xl border p-2 text-xs hover:bg-accent hover:border-primary/30 transition-all bg-card"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary animate-pulse" />
                              <span className="font-semibold truncate max-w-[240px] text-foreground">{doc.name}</span>
                            </div>
                            <Badge tone="default"><Eye className="h-3 w-3 mr-1" /> View File</Badge>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No credential files attached to this application.</p>
                    )}
                  </div>

                  {/* Interactive Audit Trail Log Timeline */}
                  <div className="rounded-2xl border p-4 bg-card">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Application History & Audit Log</h4>
                    <div className="space-y-4">
                      {selectedApp.auditTrail.map((trail, idx) => (
                        <div key={idx} className="flex gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />
                            {idx < selectedApp.auditTrail.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border my-1" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-foreground">{trail.action}</span>
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5 text-primary" /> {trail.timestamp}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium">Performed by: {trail.performedBy}</p>
                            {trail.notes && (
                              <p className="rounded bg-muted/40 border p-2 text-[11px] mt-1 text-muted-foreground leading-relaxed">
                                {trail.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Administrator Decision Form Panel */}
                  <div className="rounded-2xl border p-4 bg-muted/10 space-y-4 pt-4 border-primary/20">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Evaluation Decision Form</h4>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Update Application Status</label>
                      <select
                        value={decisionStatus}
                        onChange={(e) => setDecisionStatus(e.target.value as any)}
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-primary"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="accepted">Accepted / Admit</option>
                        <option value="rejected">Rejected / Deny</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Evaluation Remarks / Feedback Notes</label>
                      <Textarea
                        value={evaluationNotes}
                        onChange={(e) => setEvaluationNotes(e.target.value)}
                        placeholder="Enter feedback notes, deficiency summaries, or custom admission requirements..."
                        className="rounded-xl min-h-20 text-xs font-medium"
                      />
                    </div>

                    <Button
                      className="w-full bg-gradient-primary mt-2 font-bold shadow-soft"
                      disabled={isSaving}
                      onClick={handleSaveDecision}
                    >
                      {isSaving ? "Saving Decision..." : "Submit Review Decision"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Chat tab body */}
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col min-h-0 -mt-2">
                  {/* Message stream logs */}
                  <div className="flex-1 min-h-[360px] overflow-y-auto rounded-2xl border bg-muted/5 p-4 space-y-4 pr-2">
                    {loadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground font-medium">Opening secure chat stream...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                        <div className="p-3 bg-primary/10 text-primary rounded-full animate-bounce">
                          <MessageCircle className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-foreground">No chat history yet</p>
                        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                          Send a supportive response or ask the applicant for missing details directly from this console.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((m, idx) => {
                          const isSelf = m.senderRole !== "student";
                          const showDateDivider = idx === 0 || 
                            new Date(m.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
                          
                          return (
                            <div key={m.id} className="space-y-1">
                              {showDateDivider && (
                                <div className="flex justify-center my-3">
                                  <span className="text-[9px] font-bold bg-muted px-2.5 py-1 rounded-full text-muted-foreground uppercase tracking-wider border border-border/40">
                                    {new Date(m.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 shadow-soft text-xs font-medium ${
                                  isSelf 
                                    ? "bg-gradient-primary text-primary-foreground rounded-br-none" 
                                    : "bg-card text-foreground rounded-bl-none border border-border/50"
                                }`}>
                                  {!isSelf && (
                                    <div className="flex items-center gap-1.5 mb-1.5 border-b pb-1 border-border/20">
                                      <span className="font-extrabold text-[9px] text-primary uppercase tracking-wide">Applicant (Student)</span>
                                      <span className="text-[7px] font-bold bg-muted-foreground/15 text-muted-foreground px-1 py-0.5 rounded uppercase">STUDENT</span>
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

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t space-y-2 bg-card">
                    <div className="flex gap-2">
                      <textarea
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        placeholder="Type a staff message or inquiry..."
                        maxLength={1000}
                        className="flex-1 max-h-24 min-h-[44px] rounded-xl border bg-muted/30 px-3.5 py-2 text-xs focus-visible:outline-none focus:bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none font-medium text-foreground"
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
                    <div className="flex justify-between items-center text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-success rounded-full animate-ping" />
                        Connected as Admissions officer
                      </span>
                      <span>{newMessageText.length}/1000</span>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
