import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/useApi";
import { getUniversities } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/universities")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Manage Universities — Intellipath" }] }),
  component: () => <AppLayout variant="admin"><ManageUnis /></AppLayout>,
});

function ManageUnis() {
  const { data, loading } = useApi(getUniversities);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = (data ?? []).filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Manage universities" subtitle="Add, edit, or remove university listings." action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="mr-1 h-4 w-4" /> Add university</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New university</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="University name" /></div>
              <div className="space-y-2"><Label>Location</Label><Input placeholder="City, Country" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Ranking</Label><Input type="number" /></div>
                <div className="space-y-2"><Label>Acceptance %</Label><Input type="number" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-primary" onClick={() => { setOpen(false); toast.success("University added"); }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9" />
      </div>
      {loading && <Skeleton className="h-64" />}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Name</th><th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Rank</th><th className="px-5 py-3">Students</th>
              <th className="px-5 py-3">Tags</th><th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-5 py-3 font-medium">{u.logo} {u.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.location}</td>
                <td className="px-5 py-3">#{u.ranking}</td>
                <td className="px-5 py-3">{u.students.toLocaleString()}</td>
                <td className="px-5 py-3"><div className="flex gap-1">{u.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div></td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="rounded-md p-1.5 hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="rounded-md p-1.5 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
