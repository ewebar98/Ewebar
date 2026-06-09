import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Skeleton, ErrorAlert } from "@/components/ui-kit";
import {
  Users, UserPlus, Search, RefreshCw, Shield, Briefcase,
  GraduationCap, Key, Trash2, ChevronDown, Copy, Check,
  X, Eye, EyeOff, ToggleLeft, ToggleRight, AlertTriangle
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import {
  getAdminUsers, createAdminUser, updateUserRole,
  generateUserPassword, toggleUserStatus, deleteAdminUser
} from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Users | WeBAR Admin" }] }),
  component: () => <AppLayout variant="admin"><AdminUsers /></AppLayout>,
});

// Role configuration
const ROLES = [
  { value: "student", label: "Student", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "staff", label: "Staff", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { value: "customerCare", label: "Customer Care", color: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
  { value: "manager", label: "Manager", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  { value: "schoolAdmin", label: "School Admin", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { value: "admin", label: "Admin", color: "bg-red-500/15 text-red-400 border-red-500/30" },
];

const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.value, r]));

const CATEGORY_TABS = [
  { key: "all", label: "All Users", icon: Users },
  { key: "student", label: "Students", icon: GraduationCap },
  { key: "staff", label: "Staff", icon: Briefcase },
  { key: "management", label: "Management", icon: Shield },
];

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_MAP[role] ?? { label: role, color: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Password Modal ───────────────────────────────────────────────
function PasswordModal({ password, name, email, onClose }: {
  password: string; name: string; email: string; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Password Generated</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Copy this password and share it with <strong>{name}</strong> ({email}). It won't be shown again.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="flex-1 tracking-wider">
              {show ? password : "•".repeat(password.length)}
            </span>
            <button onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground transition-colors">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={copy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Password"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────
function DeleteModal({ name, onConfirm, onClose }: {
  name: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <h2 className="text-center font-display text-lg font-semibold">Delete account?</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          This will permanently delete <strong>{name}</strong>'s account. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Create User Slide-over ───────────────────────────────────────
function CreateUserPanel({ onClose, onCreated }: { onClose: () => void; onCreated: (pw: string, name: string, email: string) => void }) {
  const [form, setForm] = useState({ fullName: "", email: "", role: "staff", password: "" });
  const [autoPassword, setAutoPassword] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { fullName: form.fullName, email: form.email, role: form.role };
      if (!autoPassword && form.password) payload.password = form.password;

      const res = await createAdminUser(payload);
      onCreated(res.data.generatedPassword, res.data.fullName, res.data.email);
      toast.success("Account created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Create account</h2>
            <p className="text-xs text-muted-foreground">Add a new staff or manager account</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="e.g. John Doe"
              className="rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email Address</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. john@webar.com"
              className="rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            >
              {ROLES.filter((r) => r.value !== "student").map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Password options */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-generate password</p>
                <p className="text-xs text-muted-foreground">A secure password will be shown once</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoPassword(!autoPassword)}
                className="text-primary transition-colors hover:text-primary/80"
              >
                {autoPassword
                  ? <ToggleRight className="h-7 w-7" />
                  : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
              </button>
            </div>

            {!autoPassword && (
              <div className="mt-3">
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Set a custom password (min. 6 chars)"
                  minLength={6}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
            )}
          </div>

          <div className="mt-auto flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Create Account
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────
function UserRow({ user, onRoleChange, onGeneratePassword, onToggleStatus, onDelete }: {
  user: any;
  onRoleChange: (id: string, role: string) => void;
  onGeneratePassword: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (user: any) => void;
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const initials = user.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`group flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30 ${!user.isActive ? "opacity-50" : ""}`}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{user.fullName}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>

      {/* Join date */}
      <p className="hidden text-xs text-muted-foreground sm:block">{joinDate}</p>

      {/* Role badge + dropdown */}
      <div className="relative">
        <button
          onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:bg-muted"
        >
          <RoleBadge role={user.role} />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        <AnimatePresence>
          {roleDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border bg-card p-1 shadow-xl"
            >
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    onRoleChange(user._id, r.value);
                    setRoleDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-muted ${user.role === r.value ? "font-semibold" : ""}`}
                >
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${r.color}`}>
                    {r.label}
                  </span>
                  {user.role === r.value && <Check className="ml-auto h-3 w-3" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {roleDropdownOpen && (
          <div className="fixed inset-0 z-20" onClick={() => setRoleDropdownOpen(false)} />
        )}
      </div>

      {/* Active badge */}
      <span className={`hidden rounded-full border px-2 py-0.5 text-xs sm:inline ${user.isActive ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
        {user.isActive ? "Active" : "Inactive"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onGeneratePassword(user._id)}
          title="Generate new password"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <Key className="h-4 w-4" />
        </button>
        <button
          onClick={() => onToggleStatus(user._id)}
          title={user.isActive ? "Deactivate" : "Activate"}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {user.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-red-500" />}
        </button>
        <button
          onClick={() => onDelete(user)}
          title="Delete account"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
function AdminUsers() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ pw: string; name: string; email: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, loading, error, refresh } = useApi("getAdminUsers", () => getAdminUsers());

  const users: any[] = data?.data?.all ?? [];

  // Filter by tab + search
  const visibleUsers = users.filter((u) => {
    if (activeTab !== "all" && u.category !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const totals = data?.data?.totals ?? { students: 0, staff: 0, management: 0, total: 0 };

  const handleRoleChange = useCallback(async (id: string, role: string) => {
    try {
      await updateUserRole(id, role);
      toast.success("Role updated");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  }, [refresh]);

  const handleGeneratePassword = useCallback(async (id: string) => {
    try {
      const res = await generateUserPassword(id);
      setPasswordModal({ pw: res.data.generatedPassword, name: res.data.fullName, email: res.data.email });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate password");
    }
  }, []);

  const handleToggleStatus = useCallback(async (id: string) => {
    try {
      const res = await toggleUserStatus(id);
      toast.success(res.message);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  }, [refresh]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminUser(deleteTarget._id);
      toast.success("Account deleted");
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    }
  }, [deleteTarget, refresh]);

  const handleCreated = (pw: string, name: string, email: string) => {
    setShowCreate(false);
    setPasswordModal({ pw, name, email });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="User Management" subtitle="Manage all platform users, roles, and access." />
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Create Account
        </button>
      </div>

      {error && (
        <ErrorAlert
          title="Failed to load users"
          message={error.message || "Connection problem. Please check your internet connection."}
          onRetry={refresh}
        />
      )}

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: totals.total, icon: Users, color: "text-primary" },
          { label: "Students", value: totals.students, icon: GraduationCap, color: "text-blue-400" },
          { label: "Staff", value: totals.staff, icon: Briefcase, color: "text-purple-400" },
          { label: "Management", value: totals.management, icon: Shield, color: "text-orange-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">
              {loading ? <span className="h-6 w-10 animate-pulse rounded bg-muted inline-block" /> : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border bg-card p-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="rounded-xl border bg-card pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow w-60"
            />
          </div>
          <button
            onClick={refresh}
            className="rounded-xl border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))
        ) : visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium">No users found</p>
            <p className="text-sm text-muted-foreground">
              {search ? "Try adjusting your search" : "Create an account to get started"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibleUsers.map((user) => (
              <UserRow
                key={user._id}
                user={user}
                onRoleChange={handleRoleChange}
                onGeneratePassword={handleGeneratePassword}
                onToggleStatus={handleToggleStatus}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateUserPanel key="create" onClose={() => setShowCreate(false)} onCreated={handleCreated} />
        )}
        {passwordModal && (
          <PasswordModal
            key="password"
            password={passwordModal.pw}
            name={passwordModal.name}
            email={passwordModal.email}
            onClose={() => setPasswordModal(null)}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete"
            name={deleteTarget.fullName}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
