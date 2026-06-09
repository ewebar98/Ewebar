import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getScholarships, createScholarship, updateScholarship, deleteScholarship } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/scholarships")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Manage Scholarships — WeBAR" }] }),
  component: () => <AppLayout variant="admin"><Manage /></AppLayout>,
});

function Manage() {
  const { data, loading, refresh } = useApi("getScholarships", getScholarships);
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sponsor: "",
    amount: "",
    category: "",
    deadline: "",
    eligibility: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", sponsor: "", amount: "", category: "", deadline: "", eligibility: "" });
    setOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      sponsor: s.sponsor,
      amount: s.amount,
      category: s.category,
      deadline: s.deadline,
      eligibility: s.eligibility?.join(", ") || "",
    });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        eligibility: form.eligibility.split(",").map(e => e.trim()).filter(Boolean),
      };
      if (editingId) {
        await updateScholarship(editingId, payload);
        toast.success("Scholarship updated");
      } else {
        await createScholarship(payload);
        toast.success("Scholarship created");
      }
      refresh();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteScholarship(deleteId);
      toast.success("Scholarship deleted");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manage scholarships" subtitle="Maintain scholarship listings and deadlines." action={
        <Button className="bg-gradient-primary" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add scholarship</Button>
      } />
      {loading && <Skeleton className="h-64" />}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
              <th className="px-5 py-3">Name</th><th className="px-5 py-3">Sponsor</th>
              <th className="px-5 py-3">Amount</th><th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Deadline</th><th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-5 py-3 font-medium">{s.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.sponsor}</td>
                <td className="px-5 py-3 font-semibold text-primary">{s.amount}</td>
                <td className="px-5 py-3"><Badge tone="primary">{s.category}</Badge></td>
                <td className="px-5 py-3 text-muted-foreground">{s.deadline}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="rounded-md p-1.5 hover:bg-accent" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded-md p-1.5 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && (!data || data.length === 0) && (
          <div className="p-8 text-center text-muted-foreground">No scholarships found.</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Scholarship" : "Add Scholarship"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Sponsor</Label>
              <Input value={form.sponsor} onChange={(e) => setForm({ ...form, sponsor: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Category (e.g. Merit, Need)</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Eligibility (Comma separated)</Label>
              <Input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} placeholder="All Applicants, STEM" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the scholarship.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
