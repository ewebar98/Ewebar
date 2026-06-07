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
import { getUniversities, createInstitution, updateInstitution, deleteInstitution } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/universities")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Manage Schools & Benchmarks — WeBAR" }] }),
  component: () => <AppLayout variant="admin"><ManageUnis /></AppLayout>,
});

function ManageUnis() {
  const { data, loading, refresh } = useApi(getUniversities);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [instType, setInstType] = useState("university");
  const [ownerType, setOwnerType] = useState("federal");
  const [stateStr, setStateStr] = useState("");
  const [cityStr, setCityStr] = useState("");
  const [tuitionStr, setTuitionStr] = useState("₦150,000/yr");
  const [acceptanceRateNum, setAcceptanceRateNum] = useState(25);
  const [studentPopulationNum, setStudentPopulationNum] = useState(15000);
  const [rankingNum, setRankingNum] = useState(10);
  const [tagsStr, setTagsStr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = (data ?? []).filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));

  const handleOpenAdd = () => {
    setSelectedUni(null);
    setName("");
    setInstType("university");
    setOwnerType("federal");
    setStateStr("");
    setCityStr("");
    setTuitionStr("₦150,000/yr");
    setAcceptanceRateNum(25);
    setStudentPopulationNum(15000);
    setRankingNum(10);
    setTagsStr("NUC, University");
    setOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setSelectedUni(u);
    setName(u.name);
    setInstType(u.type || "university");
    const [city, state] = u.location.split(", ");
    setCityStr(city || "");
    setStateStr(state || "");
    setTuitionStr(u.tuition || "₦150,000/yr");
    setAcceptanceRateNum(u.acceptance || 25);
    setStudentPopulationNum(u.students || 15000);
    setRankingNum(u.ranking || 10);
    setTagsStr(u.tags?.join(", ") || "");

    const lowerTags = u.tags?.map((t: string) => t.toLowerCase()) || [];
    if (lowerTags.includes("private")) {
      setOwnerType("private");
    } else if (lowerTags.includes("state")) {
      setOwnerType("state");
    } else {
      setOwnerType("federal");
    }

    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !stateStr.trim() || !cityStr.trim()) {
      toast.error("Please fill in name, city, and state");
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      institutionType: instType,
      ownershipType: ownerType,
      state: stateStr,
      city: cityStr,
      tuition: tuitionStr,
      acceptanceRate: Number(acceptanceRateNum),
      studentPopulation: Number(studentPopulationNum),
      ranking: Number(rankingNum),
      tags: tagsStr.split(",").map((t) => t.trim()).filter((t) => t !== ""),
    };

    const finalTags = [...payload.tags];
    const typeLabel = instType.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    if (!finalTags.some(t => t.toLowerCase() === typeLabel.toLowerCase())) {
      finalTags.push(typeLabel);
    }
    const ownerLabel = ownerType.charAt(0).toUpperCase() + ownerType.slice(1);
    if (!finalTags.some(t => t.toLowerCase() === ownerLabel.toLowerCase())) {
      finalTags.push(ownerLabel);
    }
    payload.tags = finalTags;

    try {
      if (selectedUni) {
        await updateInstitution(selectedUni.id, payload);
        toast.success("School details updated successfully!");
      } else {
        await createInstitution(payload);
        toast.success("New school added successfully!");
      }
      setOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save institution details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: any) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${u.name}? This will also wipe all its faculties, departments, courses, and pending applications!`)) {
      return;
    }

    try {
      await deleteInstitution(u.id);
      toast.success(`${u.name} successfully deleted.`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete institution");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manage Schools & Benchmarks" 
        subtitle="Configure universities, polytechnics, nursing schools, and general entry cut-off marks." 
        action={
          <Button onClick={handleOpenAdd} className="bg-gradient-primary">
            <Plus className="mr-1 h-4 w-4" /> Add school
          </Button>
        } 
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search schools..." className="pl-9" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUni ? "Edit School Details" : "Register New School"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">School Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. University of Lagos" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="instType">School Type</Label>
                <select 
                  id="instType" 
                  value={instType} 
                  onChange={(e) => setInstType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="university">University</option>
                  <option value="polytechnic">Polytechnic</option>
                  <option value="college_of_education">College of Education</option>
                  <option value="school_of_nursing">School of Nursing</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ownerType">Ownership Type</Label>
                <select 
                  id="ownerType" 
                  value={ownerType} 
                  onChange={(e) => setOwnerType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="federal">Federal</option>
                  <option value="state">State</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={cityStr} onChange={(e) => setCityStr(e.target.value)} placeholder="e.g. Yaba" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={stateStr} onChange={(e) => setStateStr(e.target.value)} placeholder="e.g. Lagos" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tuition">Tuition Fee</Label>
                <Input id="tuition" value={tuitionStr} onChange={(e) => setTuitionStr(e.target.value)} placeholder="e.g. ₦120,000/yr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ranking">National Ranking</Label>
                <Input id="ranking" type="number" value={rankingNum} onChange={(e) => setRankingNum(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="acceptance">Acceptance Rate %</Label>
                <Input id="acceptance" type="number" value={acceptanceRateNum} onChange={(e) => setAcceptanceRateNum(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="population">Student Population</Label>
                <Input id="population" type="number" value={studentPopulationNum} onChange={(e) => setStudentPopulationNum(Number(e.target.value))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (Comma-separated)</Label>
              <Input id="tags" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="e.g. NUC, Engineering, Technical" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button className="bg-gradient-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : "Save Details"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && <Skeleton className="h-64 rounded-2xl" />}
      
      {!loading && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Tuition</th>
                <th className="px-5 py-3.5">Students</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-4 font-medium flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-gradient-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {u.name.substring(0, 2).toUpperCase()}
                    </span>
                    {u.name}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={
                      u.type === "university" ? "primary" :
                      u.type === "polytechnic" ? "warning" :
                      u.type === "school_of_nursing" ? "success" : "default"
                    }>
                      {u.type === "university" ? "University" :
                       u.type === "polytechnic" ? "Polytechnic" :
                       u.type === "school_of_nursing" ? "School of Nursing" : "College of Ed."}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{u.location}</td>
                  <td className="px-5 py-4 font-medium text-foreground">{u.tuition}</td>
                  <td className="px-5 py-4 text-muted-foreground">{u.students.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => handleOpenEdit(u)} 
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Edit School"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u)} 
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete School"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    No schools matching your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
