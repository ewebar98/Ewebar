// src/routes/admin.admissionRules.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui-kit";
import { Button, Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter, Input, Label } from "@/components/ui-kit";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  fetchAdmissionRules,
  createAdmissionRule,
  updateAdmissionRule,
  deleteAdmissionRule,
} from "@/services/api";

interface AdmissionRule {
  _id: string;
  name: string;
  description?: string;
  criteria: any; // Adjust based on actual schema
}

export const Route = createFileRoute("/admin/admissionRules")({
  beforeLoad: async () => {
    // Only admin users can access (assume requireRole middleware works globally)
    return {};
  },
  component: AdminAdmissionRules,
});

function AdminAdmissionRules() {
  const [rules, setRules] = useState<AdmissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<AdmissionRule | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", criteria: "" });

  const loadRules = async () => {
    try {
      const data = await fetchAdmissionRules();
      setRules(data);
    } catch (e: any) {
      setError(e.message || "Failed to load admission rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await deleteAdmissionRule(id);
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const openCreate = () => {
    setFormData({ name: "", description: "", criteria: "" });
    setIsCreateOpen(true);
  };

  const openEdit = (rule: AdmissionRule) => {
    setCurrentRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description ?? "",
      criteria: JSON.stringify(rule.criteria, null, 2),
    });
    setIsEditOpen(true);
  };

  const handleCreate = async () => {
    try {
      const newRule = await createAdmissionRule({
        name: formData.name,
        description: formData.description,
        criteria: JSON.parse(formData.criteria),
      });
      setRules((prev) => [...prev, newRule]);
      setIsCreateOpen(false);
    } catch (e: any) {
      alert(e.message || "Create failed");
    }
  };

  const handleUpdate = async () => {
    if (!currentRule) return;
    try {
      const updated = await updateAdmissionRule(currentRule._id, {
        name: formData.name,
        description: formData.description,
        criteria: JSON.parse(formData.criteria),
      });
      setRules((prev) => prev.map((r) => (r._id === currentRule._id ? updated : r)));
      setIsEditOpen(false);
    } catch (e: any) {
      alert(e.message || "Update failed");
    }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-6">
        <h1 className="font-display text-2xl font-bold mb-4">Admission Rules</h1>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <Button onClick={openCreate} className="mb-4 flex items-center">
          <Plus className="h-4 w-4 mr-1" /> New Rule
        </Button>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule._id}>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>{rule.description ?? "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(rule)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(rule._id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admission Rule</DialogTitle>
              <DialogDescription>Enter details for the new rule.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="criteria" className="text-right">Criteria (JSON)</Label>
                <Input id="criteria" value={formData.criteria} onChange={(e) => setFormData({ ...formData, criteria: e.target.value })} className="col-span-3" placeholder="{...}" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Admission Rule</DialogTitle>
              <DialogDescription>Modify the rule details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">Description</Label>
                <Input id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-criteria" className="text-right">Criteria (JSON)</Label>
                <Input id="edit-criteria" value={formData.criteria} onChange={(e) => setFormData({ ...formData, criteria: e.target.value })} className="col-span-3" placeholder="{...}" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleUpdate}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminLayout>
  );
}
