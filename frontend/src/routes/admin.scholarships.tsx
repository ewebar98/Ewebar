import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getScholarships } from "@/services/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/scholarships")({
  beforeLoad: requireRole("admin"),
  head: () => ({ meta: [{ title: "Manage Scholarships — Intellipath" }] }),
  component: () => <AppLayout variant="admin"><Manage /></AppLayout>,
});

function Manage() {
  const { data, loading } = useApi(getScholarships);
  return (
    <div className="space-y-6">
      <PageHeader title="Manage scholarships" subtitle="Maintain scholarship listings and deadlines." action={
        <Button className="bg-gradient-primary"><Plus className="mr-1 h-4 w-4" /> Add scholarship</Button>
      } />
      {loading && <Skeleton className="h-64" />}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Name</th><th className="px-5 py-3">Sponsor</th>
              <th className="px-5 py-3">Amount</th><th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Deadline</th><th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-5 py-3 font-medium">{s.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.sponsor}</td>
                <td className="px-5 py-3 font-semibold text-primary">{s.amount}</td>
                <td className="px-5 py-3"><Badge tone="primary">{s.category}</Badge></td>
                <td className="px-5 py-3 text-muted-foreground">{s.deadline}</td>
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
