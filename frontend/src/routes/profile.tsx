import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { ScanLine, FilePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, Skeleton } from "@/components/ui-kit";
import { useApi } from "@/hooks/useApi";
import { getProfile, ocrExtractResult } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Profile | Intellipath" }] }),
  component: () => <AppLayout><Profile /></AppLayout>,
});

function Profile() {
  const { data, loading } = useApi(getProfile);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Awaited<ReturnType<typeof ocrExtractResult>> | null>(null);

  const handleResultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      const res = await ocrExtractResult(file);
      setExtracted(res);
      toast.success(`Extracted ${res.examType} result`);
    } finally {
      setExtracting(false);
    }
  };

  if (loading || !data) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Your profile" subtitle="Personal, academic, and preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground">
              AE
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{data.name}</h3>
            <p className="text-sm text-muted-foreground">{data.email}</p>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{data.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span>{data.dob}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">State</span><span>{data.state}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">JAMB</span><span className="font-semibold text-primary">{data.jambScore}</span></div>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {data.interests.map((i) => <Badge key={i} tone="primary">{i}</Badge>)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Intelligent upload */}
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Intelligent Result Upload</h3>
            </div>
            <p className="text-sm text-muted-foreground">Upload your JAMB or WAEC/NECO result. Subjects and grades will be extracted automatically.</p>
            <label className="mt-4 inline-flex">
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleResultUpload} />
              <Button asChild className="bg-gradient-primary">
                <span>{extracting ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Extracting...</> : <><FilePlus className="mr-1 h-4 w-4" /> Upload result</>}</span>
              </Button>
            </label>

            {extracted && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between">
                  <Badge tone="success">{extracted.examType} extracted</Badge>
                  <span className="font-display text-xl font-bold gradient-text">{extracted.score}</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {extracted.subjects.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                      <Input defaultValue={s.name} className="border-0 p-0 text-sm" />
                      <Input defaultValue={s.grade} className="w-16 border-0 p-0 text-right text-sm" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Academic info */}
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-display text-lg font-semibold">Academic information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>JAMB Score</Label><Input defaultValue={data.jambScore} /></div>
              <div className="space-y-2"><Label>WAEC Aggregate</Label><Input defaultValue={data.waecAggregate} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Bio</Label><Textarea defaultValue={data.bio} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Preferred universities</Label>
                <Input defaultValue={data.preferredUniversities.join(", ")} />
              </div>
            </div>
            <Button className="mt-4 bg-gradient-primary">Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
