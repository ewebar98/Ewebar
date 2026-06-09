import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { Bell, Check, CheckCircle2, AlertCircle, XCircle, ArrowRight, Eye } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton, EmptyState, ErrorAlert } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Notifications — Intellipath" }] }),
  component: () => <AppLayout><Notifications /></AppLayout>,
});

function Notifications() {
  const { data, loading, error, refresh } = useApi(getNotifications);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fnKey = getNotifications.toString().replace(/\s+/g, "");

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      // Invalidate TanStack query cache to update topbar count and feed state globally
      queryClient.invalidateQueries({ queryKey: [fnKey] });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      queryClient.invalidateQueries({ queryKey: [fnKey] });
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const filteredNotifs = data?.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  }) ?? [];

  const unreadCount = data?.filter((n) => !n.read).length ?? 0;

  // Custom visual theme styling configurations per notification type
  const getConfig = (type: string) => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle2,
          bg: "bg-success/10 text-success dark:bg-success/20",
          border: "border-l-4 border-l-success",
          tone: "success" as const,
        };
      case "error":
        return {
          icon: XCircle,
          bg: "bg-destructive/10 text-destructive dark:bg-destructive/20",
          border: "border-l-4 border-l-destructive",
          tone: "destructive" as const,
        };
      case "warning":
        return {
          icon: AlertCircle,
          bg: "bg-warning/15 text-warning dark:bg-warning/20",
          border: "border-l-4 border-l-warning",
          tone: "warning" as const,
        };
      case "info":
      default:
        return {
          icon: Bell,
          bg: "bg-primary/10 text-primary dark:bg-primary/20",
          border: "border-l-4 border-l-primary",
          tone: "primary" as const,
        };
    }
  };

  const headerAction = unreadCount > 0 ? (
    <button
      onClick={handleMarkAllAsRead}
      className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 transition-all shadow-sm"
    >
      <Check className="h-4 w-4" />
      Mark all as read
    </button>
  ) : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Notifications" 
        subtitle="Stay up to date with your university admissions journey." 
        action={headerAction}
      />

      {error && (
        <ErrorAlert
          title="Failed to load notifications"
          message={error.message || "A connection problem occurred. Please check your internet connection."}
          onRetry={refresh}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-primary text-primary-foreground shadow-soft font-semibold"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          All Notifications ({data?.length ?? 0})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
            filter === "unread"
              ? "bg-primary text-primary-foreground shadow-soft font-semibold"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!loading && !error && filteredNotifs.length === 0 && (
        <EmptyState 
          icon={Bell} 
          title={filter === "unread" ? "You're all caught up!" : "No notifications yet"} 
          hint={filter === "unread" ? "No unread alerts in your queue." : "Critical updates regarding your application status, OCR documents, and AI advisor notes will appear here."}
        />
      )}

      {/* Animated Notifications Queue */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredNotifs.map((n) => {
            const config = getConfig(n.type);
            const Icon = config.icon;
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start justify-between rounded-2xl border p-4 shadow-soft transition-all duration-200 ${
                  config.border
                } ${n.read ? "bg-card/75 border-muted" : "bg-card border-primary/20 shadow-md"}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${config.bg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm md:text-base ${n.read ? "text-foreground/80" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      {!n.read && <Badge tone={config.tone}>New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/80">{n.time}</p>
                    
                    {n.link && (
                      <div className="pt-2">
                        <Link
                          to={n.link}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    aria-label="Mark as read"
                    className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
