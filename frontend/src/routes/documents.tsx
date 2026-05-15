import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Upload, FileText, CheckCircle2, X, Loader2, ScanLine, Eye } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, EmptyState } from "@/components/ui-kit";
import { uploadDocument, ocrExtractResult } from "@/services/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/documents")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Documents | Intellipath" }] }),
  component: () => <AppLayout><Documents /></AppLayout>,
});

type OcrResult = {
  examType: string;
  score: number;
  subjects: { name: string; grade: string }[];
};

type Doc = {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "ocr" | "ready" | "error";
  progress: number;
  ocr?: OcrResult;
};

function Documents() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<Doc | null>(null);

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const newDoc: Doc = { id, name: file.name, size: file.size, status: "uploading", progress: 0 };
      setDocs((d) => [newDoc, ...d]);
      // simulate upload progress
      for (let p = 10; p <= 90; p += 20) {
        await new Promise((r) => setTimeout(r, 150));
        setDocs((d) => d.map((x) => (x.id === id ? { ...x, progress: p } : x)));
      }
      try {
        await uploadDocument(file);
        // Move to OCR phase
        setDocs((d) => d.map((x) => (x.id === id ? { ...x, status: "ocr", progress: 100 } : x)));
        const ocr = await ocrExtractResult(file);
        setDocs((d) => d.map((x) => (x.id === id ? { ...x, status: "ready", ocr } : x)));
        toast.success(`${file.name} processed (OCR complete)`);
      } catch {
        setDocs((d) => d.map((x) => (x.id === id ? { ...x, status: "error" } : x)));
        toast.error("Upload failed");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" subtitle="Upload your results, transcripts and certificates. We'll extract them automatically." />

      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        animate={{ scale: drag ? 1.01 : 1 }}
        className={`rounded-3xl border-2 border-dashed bg-card p-12 text-center transition-colors ${drag ? "border-primary bg-primary/5" : ""}`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Upload className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold">Drag & drop files here</h3>
        <p className="mt-1 text-sm text-muted-foreground">PDF, JPG, PNG up to 10MB. JAMB & WAEC are auto-recognized.</p>
        <label className="mt-4 inline-block">
          <input type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          <Button className="bg-gradient-primary" asChild><span>Browse files</span></Button>
        </label>
      </motion.div>

      <div className="grid gap-3">
        {docs.length === 0 && <EmptyState icon={FileText} title="No documents yet" hint="Drop a file above to begin." />}
        {docs.map((d) => (
          <motion.div
            key={d.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border bg-card p-4 shadow-soft"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">{(d.size / 1024).toFixed(1)} KB</p>
                {(d.status === "uploading" || d.status === "ocr") && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      animate={{ width: d.status === "ocr" ? "100%" : `${d.progress}%` }}
                      className={`h-full ${d.status === "ocr" ? "bg-warning animate-pulse" : "bg-gradient-primary"}`}
                    />
                  </div>
                )}
                {d.status === "ocr" && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                    <ScanLine className="h-3 w-3 animate-pulse" /> Running OCR…
                  </p>
                )}
              </div>
              {d.status === "ready" && (
                <>
                  <Badge tone="success"><CheckCircle2 className="mr-1 h-3 w-3" />Ready</Badge>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreview(d)}>
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                </>
              )}
              {d.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {d.status === "ocr" && <Loader2 className="h-4 w-4 animate-spin text-warning" />}
              {d.status === "error" && <Badge tone="destructive">Failed</Badge>}
              <button onClick={() => setDocs((x) => x.filter((y) => y.id !== d.id))} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inline OCR summary */}
            {d.status === "ready" && d.ocr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 rounded-xl border bg-muted/40 p-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{d.ocr.examType} extracted</span>
                  <Badge tone="primary">Score: {d.ocr.score}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs sm:grid-cols-5">
                  {d.ocr.subjects.map((s) => (
                    <div key={s.name} className="rounded-md bg-background px-2 py-1">
                      <p className="truncate text-muted-foreground">{s.name}</p>
                      <p className="font-semibold">{s.grade}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Full OCR preview modal */}
      <AnimatePresence>
        {preview && preview.ocr && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-elegant"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">OCR Preview</p>
                  <h3 className="font-display text-lg font-semibold">{preview.name}</h3>
                </div>
                <button onClick={() => setPreview(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="rounded-xl bg-gradient-hero p-4">
                <p className="text-xs text-muted-foreground">Detected exam</p>
                <p className="font-display text-xl font-bold">{preview.ocr.examType}</p>
                <p className="mt-2 text-xs text-muted-foreground">Aggregate score</p>
                <p className="font-display text-3xl font-bold gradient-text">{preview.ocr.score}</p>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subjects</p>
                <div className="space-y-1.5">
                  {preview.ocr.subjects.map((s) => (
                    <div key={s.name} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                      <span>{s.name}</span>
                      <Badge tone="success">{s.grade}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setPreview(null)} className="mt-5 w-full bg-gradient-primary">Looks good</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
