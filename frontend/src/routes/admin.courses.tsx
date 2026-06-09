import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useState } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { 
  getCourses, 
  getUniversities, 
  getAdminFaculties, 
  getAdminDepartments, 
  getCourseById, 
  getProgramForAdmin,
  runProgramAdmissions,
  createProgram, 
  updateProgram, 
  deleteProgram,
  createFaculty,
  createDepartment
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/courses")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Manage Course Catalog — WeBAR" }] }),
  component: () => <AppLayout variant="admin"><ManageCourses /></AppLayout>,
});

function ManageCourses() {
  const { data: courses, loading: loadingCourses, refresh: refreshCourses } = useApi(getCourses);
  const { data: schools } = useApi(getUniversities);
  const { data: faculties, refresh: refreshFaculties } = useApi(getAdminFaculties);
  const { data: departments, refresh: refreshDepartments } = useApi(getAdminDepartments);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [instId, setInstId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [duration, setDuration] = useState("4 years");
  const [cutoffMark, setCutoffMark] = useState(180);
  const [tuition, setTuition] = useState("₦150,000/yr");
  const [requirementsStr, setRequirementsStr] = useState("English, Mathematics");
  const [careerPathsStr, setCareerPathsStr] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [autoAdmissionEnabled, setAutoAdmissionEnabled] = useState(false);
  const [autoAdmissionMode, setAutoAdmissionMode] = useState<"immediate" | "batch">("batch");
  const [autoAdmissionThreshold, setAutoAdmissionThreshold] = useState(85);

  // Quick Add Faculty/Dept Modal state
  const [showQuickFaculty, setShowQuickFaculty] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [showQuickDept, setShowQuickDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  const filteredCourses = (courses ?? []).filter(
    (c) => {
      const name = (c?.name || "").toString().toLowerCase();
      const faculty = (c?.faculty || "").toString().toLowerCase();
      const qq = (q || "").toString().toLowerCase();
      return name.includes(qq) || faculty.includes(qq);
    }
  );

  // Relationally filter faculties and departments based on form selection
  const filteredFaculties = (faculties ?? []).filter(
    (f) => f.institutionId?._id === instId || f.institutionId === instId
  );
  
  const filteredDepartments = (departments ?? []).filter(
    (d) => d.facultyId?._id === facultyId || d.facultyId === facultyId
  );

  const handleOpenAdd = () => {
    setSelectedCourse(null);
    setName("");
    setInstId(""); // Default to empty, require selection
    setFacultyId("");
    setDeptId("");
    setDuration("4 years");
    setCutoffMark(180);
    setTuition("₦150,000/yr");
    setRequirementsStr("English, Mathematics");
    setCareerPathsStr("");
    setDescription("");
    setAutoAdmissionEnabled(false);
    setAutoAdmissionMode("batch");
    setAutoAdmissionThreshold(85);
    setOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    // Fetch the full program details (so we get facultyId/departmentId and real cutoff fields)
    (async () => {
      try {
        setSelectedCourse(c);
        // If the passed course already contains the necessary IDs use them, else fetch by id
        if (c?.id) {
          const program = await getProgramForAdmin(c.id);
          if (program) {
            setName(program.name || c.name || "");
            setInstId(program.institutionId || c.institutionId || "");
            setFacultyId(program.facultyId?._id || program.facultyId || "");
            setDeptId(program.departmentId?._id || program.departmentId || "");
            setDuration(program.duration || c.duration || "4 years");
            setCutoffMark(program.cutoffMark || c.cutoff || 180);
            setTuition(program.tuition || c.tuition || "₦150,000/yr");
            setDescription(program.description || c.description || "");
            setAutoAdmissionEnabled(program.autoAdmission?.enabled || false);
            setAutoAdmissionMode(program.autoAdmission?.mode || "batch");
            setAutoAdmissionThreshold(program.autoAdmission?.autoAcceptThreshold || 85);
          } else {
            // Fallback to available values
            setName(c.name || "");
            setInstId(c.institutionId || "");
            setDuration(c.duration || "4 years");
            setCutoffMark(c.cutoff || 180);
            setTuition(c.tuition || "₦150,000/yr");
            setDescription(c.description || "");
            setFacultyId("");
            setDeptId("");
          }
        }
      } catch (err: any) {
        // best effort: populate with existing values
        setSelectedCourse(c);
        setName(c.name || "");
        setInstId(c.institutionId || "");
        setDuration(c.duration || "4 years");
        setCutoffMark(c.cutoff || 180);
        setTuition(c.tuition || "₦150,000/yr");
        setDescription(c.description || "");
        setFacultyId("");
        setDeptId("");
      } finally {
        setOpen(true);
      }
    })();
  };

  const handleQuickAddFaculty = async () => {
    if (!instId) {
      toast.error("Please select a school first.");
      return;
    }
    if (!newFacultyName.trim()) {
      toast.error("Please enter a faculty name.");
      return;
    }

    try {
      const res = await createFaculty(instId, newFacultyName);
      toast.success("Faculty created!");
      setNewFacultyName("");
      setShowQuickFaculty(false);
      await refreshFaculties();
      setFacultyId(res.data?._id || res.data?.id || res._id || res.id || ""); // Ensure all possible ID fields are checked
    } catch (err: any) {
      toast.error(err.message || "Failed to create faculty");
    }
  };

  const handleQuickAddDept = async () => {
    if (!instId || !facultyId) {
      toast.error("Please select a school and a faculty first.");
      return;
    }
    if (!newDeptName.trim()) {
      toast.error("Please enter a department name.");
      return;
    }

    try {
      const res = await createDepartment(instId, facultyId, newDeptName);
      toast.success("Department created!");
      setNewDeptName("");
      setShowQuickDept(false);
      await refreshDepartments();
      setDeptId(res.data?._id || res.data?.id || res._id || res.id || ""); // Ensure all possible ID fields are checked
    } catch (err: any) {
      toast.error(err.message || "Failed to create department");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !instId || !facultyId || !deptId || !cutoffMark) {
      toast.error("Please fill in name, school, faculty, department, and cutoff mark.");
      return;
    }

    setSubmitting(true);
    const payload = {
      institutionId: instId,
      facultyId,
      departmentId: deptId,
      name,
      duration,
      cutoffMark: Number(cutoffMark),
      tuition,
      autoAdmission: { enabled: autoAdmissionEnabled, mode: autoAdmissionMode, autoAcceptThreshold: Number(autoAdmissionThreshold) },
      requirements: requirementsStr.split(",").map((r) => r.trim()).filter((r) => r !== ""),
      careerPaths: careerPathsStr.split(",").map((c) => c.trim()).filter((c) => c !== ""),
      description,
    };

    try {
      if (selectedCourse) {
        await updateProgram(selectedCourse.id, payload);
        toast.success("Course details updated successfully!");
      } else {
        await createProgram(payload);
        toast.success("New course created successfully!");
      }
      setOpen(false);
      refreshCourses();
    } catch (err: any) {
      toast.error(err.message || "Failed to save course details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunAdmissions = async (c: any) => {
    if (!window.confirm(`Run batch admissions now for "${c.name}"?`)) return;
    try {
      setSubmitting(true);
      const res = await runProgramAdmissions(c.id);
      toast.success(res.message || "Admissions run completed");
      refreshCourses();
    } catch (err: any) {
      toast.error(err.message || "Failed to run admissions");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: any) => {
    if (!window.confirm(`Are you sure you want to delete the course "${c.name}"? This will also delete any student applications mapped to this course!`)) {
      return;
    }

    try {
      await deleteProgram(c.id);
      toast.success(`Course "${c.name}" successfully deleted.`);
      refreshCourses();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete course");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manage Catalog Courses" 
        subtitle="Configure programs, departmental entry criteria, durations, and dynamic UTME cut-offs." 
        action={
          <Button onClick={handleOpenAdd} className="bg-gradient-primary">
            <Plus className="mr-1 h-4 w-4" /> Add course
          </Button>
        } 
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses or faculties..." className="pl-9" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCourse ? "Edit Course Catalog Item" : "Register New Course Catalog Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Course/Program Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Computer Science" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="school">Target School</Label>
              <select 
                id="school" 
                value={instId} 
                onChange={(e) => {
                  setInstId(e.target.value);
                  setFacultyId("");
                  setDeptId("");
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Select School --</option>
                {schools?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="faculty">Faculty</Label>
                <select 
                  id="faculty" 
                  value={facultyId} 
                  onChange={(e) => {
                    setFacultyId(e.target.value);
                    setDeptId("");
                  }}
                  disabled={!instId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">-- Select Faculty --</option>
                  {filteredFaculties.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowQuickFaculty(true)} 
                disabled={!instId}
                className="h-10 text-xs gap-1 border-dashed"
              >
                <Plus className="h-3 w-3" /> Quick Add
              </Button>
            </div>

            {showQuickFaculty && (
              <div className="p-3 border rounded-xl bg-muted/40 space-y-2">
                <Label className="text-xs">Quick Add Faculty Name</Label>
                <div className="flex gap-2">
                  <Input value={newFacultyName} onChange={(e) => setNewFacultyName(e.target.value)} placeholder="e.g. Sciences" className="h-8 text-xs" />
                  <Button size="sm" onClick={handleQuickAddFaculty} className="h-8 text-xs bg-gradient-primary">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowQuickFaculty(false)} className="h-8 text-xs">Cancel</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="dept">Department</Label>
                <select 
                  id="dept" 
                  value={deptId} 
                  onChange={(e) => setDeptId(e.target.value)}
                  disabled={!facultyId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">-- Select Department --</option>
                  {filteredDepartments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowQuickDept(true)} 
                disabled={!facultyId}
                className="h-10 text-xs gap-1 border-dashed"
              >
                <Plus className="h-3 w-3" /> Quick Add
              </Button>
            </div>

            {showQuickDept && (
              <div className="p-3 border rounded-xl bg-muted/40 space-y-2">
                <Label className="text-xs">Quick Add Department Name</Label>
                <div className="flex gap-2">
                  <Input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g. Department of Computer Science" className="h-8 text-xs" />
                  <Button size="sm" onClick={handleQuickAddDept} className="h-8 text-xs bg-gradient-primary">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowQuickDept(false)} className="h-8 text-xs">Cancel</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="duration">Course Duration</Label>
                <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 4 years" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cutoff">UTME Cutoff Mark</Label>
                <Input id="cutoff" type="number" value={cutoffMark} onChange={(e) => setCutoffMark(Number(e.target.value))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tuition">Tuition Fee</Label>
              <Input id="tuition" value={tuition} onChange={(e) => setTuition(e.target.value)} placeholder="e.g. ₦160,000/yr" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requirements">O'Level Requirements (Comma-separated)</Label>
              <Input id="requirements" value={requirementsStr} onChange={(e) => setRequirementsStr(e.target.value)} placeholder="e.g. English, Mathematics, Physics" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="careers">Career Paths (Comma-separated)</Label>
              <Input id="careers" value={careerPathsStr} onChange={(e) => setCareerPathsStr(e.target.value)} placeholder="e.g. Software Engineer, Tech Lead" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Course Description</Label>
              <textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief outline of the course and curriculum..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="p-3 border rounded-lg bg-muted/30">
              <Label className="text-sm">Auto Admission (Admin Controlled)</Label>
              <div className="flex items-center gap-3 mt-2">
                <input id="autoEnabled" type="checkbox" checked={autoAdmissionEnabled} onChange={(e) => setAutoAdmissionEnabled(e.target.checked)} />
                <label htmlFor="autoEnabled" className="text-sm">Enable automatic admissions for this program</label>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label className="text-xs">Mode</Label>
                  <select value={autoAdmissionMode} onChange={(e) => setAutoAdmissionMode(e.target.value as any)} className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                    <option value="batch">Batch (admin-controlled)</option>
                    <option value="immediate">Immediate (auto-accept on apply)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Immediate Threshold</Label>
                  <Input type="number" value={autoAdmissionThreshold} onChange={(e) => setAutoAdmissionThreshold(Number(e.target.value))} className="h-9" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Immediate mode will auto-accept applicants whose computed match score is at or above the threshold and slots are available.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button className="bg-gradient-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : "Save Catalog Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loadingCourses && <Skeleton className="h-64 rounded-2xl" />}

      {!loadingCourses && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCourses.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-card p-5 shadow-soft hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold text-base leading-tight text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.faculty} · {c.duration}
                  </p>
                </div>
                <div className="shrink-0">
                  <Badge tone={c.cutoff >= 200 ? "primary" : c.cutoff >= 150 ? "success" : "warning"}>
                    Cutoff {c.cutoff}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{c.description}</p>
              
              <div className="mt-4 pt-3.5 border-t flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">{c.tuition}</span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleOpenEdit(c)} 
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    title="Edit Course"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleRunAdmissions(c)} 
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
                    title="Run Admissions"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(c)} 
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredCourses.length === 0 && (
            <div className="col-span-2 text-center py-12 border border-dashed rounded-2xl text-muted-foreground">
              No courses matching your search query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
