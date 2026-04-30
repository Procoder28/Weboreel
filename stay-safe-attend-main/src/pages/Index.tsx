import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AttendanceForm } from "@/components/AttendanceForm";
import { ResultPanel } from "@/components/ResultPanel";
import type { AttendanceInputs, PredictionResult } from "@/lib/attendance";

const Index = () => {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [inputs, setInputs] = useState<AttendanceInputs | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-foreground/15">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-foreground" aria-hidden />
            <span className="font-display text-lg font-semibold tracking-tight">
              AttendSmart<span className="text-accent">.</span>AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              v1.0 · edge-powered
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-foreground/15">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            ── Attendance Predictor
          </div>
          <h1 className="mt-6 font-display text-5xl sm:text-7xl font-medium leading-[0.95] tracking-tight text-balance">
            Will you make
            <br />
            the <span className="text-accent">75%</span> cut-off?
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground text-balance">
            Drop in your numbers. We'll forecast your final attendance, tell you
            exactly how many classes you must attend, and draft a recovery plan.
          </p>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-16 space-y-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto_1.2fr] lg:gap-16">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              01 — Input
            </div>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight">
              Your numbers
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              All fields are positive integers. Required % defaults to 75.
            </p>
          </div>

          <div className="hidden lg:block w-px bg-foreground/15" />

          <div>
            <AttendanceForm
              onResult={(r, i) => {
                setResult(r);
                setInputs(i);
                setTimeout(() => {
                  document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
            />
          </div>
        </div>

        {result && inputs && (
          <div id="result" className="scroll-mt-8">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              02 — Forecast
            </div>
            <h2 className="mt-2 mb-8 font-display text-2xl font-medium tracking-tight">
              Your forecast
            </h2>
            <ResultPanel result={result} inputs={inputs} />
          </div>
        )}
      </main>

      <footer className="border-t border-foreground/15">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-6 py-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>AttendSmart AI · Built with Lovable</span>
          <span>Stay above the line.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
