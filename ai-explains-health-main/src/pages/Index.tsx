import { useState } from "react";
import { Activity, Download, ShieldAlert, Sparkles, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ParameterCard } from "@/components/ParameterCard";
import { extractPdfText, fileToBase64 } from "@/lib/pdf";
import { buildSummaryText, downloadText } from "@/lib/summary";
import type { ReportAnalysis } from "@/lib/report-types";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<ReportAnalysis | null>(null);

  const onFile = async (f: File) => {
    setFile(f);
    setReport(null);
    await analyze(f);
  };

  const analyze = async (f: File) => {
    setAnalyzing(true);
    try {
      let payload: Record<string, unknown>;
      if (f.type === "application/pdf") {
        const text = await extractPdfText(f);
        if (!text || text.length < 20) {
          // Fallback: scanned PDF — send first as image isn't trivial here, ask for image
          toast.error("Couldn't read text from this PDF. Try uploading a clearer PDF or an image of the report.");
          setAnalyzing(false);
          return;
        }
        payload = { kind: "text", text, fileName: f.name };
      } else if (f.type.startsWith("image/")) {
        const imageBase64 = await fileToBase64(f);
        payload = { kind: "image", imageBase64, mimeType: f.type, fileName: f.name };
      } else {
        toast.error("Unsupported file type. Please upload a PDF or image.");
        setAnalyzing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-report", { body: payload });
      if (error) {
        const msg = (error as { message?: string }).message ?? "Analysis failed";
        if (msg.includes("429")) toast.error("Too many requests. Please wait a moment.");
        else if (msg.includes("402")) toast.error("AI credits exhausted. Add funds in Workspace → Usage.");
        else toast.error(msg);
        return;
      }
      if ((data as { error?: string })?.error) {
        toast.error((data as { error: string }).error);
        return;
      }
      setReport(data as ReportAnalysis);
      toast.success("Report analyzed successfully");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  };

  const onDownload = () => {
    if (!report || !file) return;
    const txt = buildSummaryText(file.name, report);
    downloadText(file.name.replace(/\.[^.]+$/, "") + "-mediexplain.txt", txt);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:pt-16">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">MediExplain AI</p>
            <p className="text-xs text-muted-foreground">Plain-language blood test explanations</p>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by Lovable AI
        </div>
      </header>

      {/* Hero */}
      <section className="mb-10 text-center sm:mb-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Understand your blood test
          <span className="block bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            in plain English.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
          Upload a PDF or photo of your report. We'll explain each value, show normal ranges, and share friendly lifestyle tips. Educational only — not medical advice.
        </p>
      </section>

      {/* Upload */}
      <UploadDropzone
        onFileSelected={onFile}
        isAnalyzing={analyzing}
        selectedFile={file}
        onClear={() => { setFile(null); setReport(null); }}
      />

      {/* Status while analyzing */}
      {analyzing && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 animate-pulse text-primary" />
          Reading your report and preparing explanations…
        </div>
      )}

      {/* Results */}
      {report && (
        <section className="mt-10 space-y-6">
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">Overview</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/90">{report.summary}</p>
              </div>
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2 text-sm font-medium transition hover:bg-secondary"
              >
                <Download className="h-4 w-4" /> Download summary
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {report.parameters.map((p, i) => (
              <ParameterCard key={i} p={p} />
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-warning/90">{report.disclaimer}</p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-muted-foreground">
        MediExplain AI · Educational tool · Always consult a qualified healthcare professional.
      </footer>
    </main>
  );
};

export default Index;
