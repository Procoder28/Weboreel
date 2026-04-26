import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MuteButton } from "@/components/MuteButton";
import { MiniTrack } from "@/components/MiniTrack";
import { loadSetup } from "@/lib/storage";
import { simulate, RaceResult } from "@/lib/simulation";
import { playRev, unlockAudio } from "@/lib/audio";

export const Route = createFileRoute("/simulate")({
  head: () => ({
    meta: [
      { title: "Simulating — Build Your F1 Car Setup" },
      { name: "description", content: "Running race simulation, calculating lap performance." },
    ],
  }),
  component: SimulateScreen,
});

const STAGES = [
  "Analyzing setup",
  "Spooling turbos",
  "Running race simulation",
  "Calculating lap performance",
];

function SimulateScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    unlockAudio();
    playRev(3.2);

    const stageTimer = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 800);

    const start = performance.now();
    const duration = 3400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        const result: RaceResult = simulate(loadSetup());
        try { localStorage.setItem("f1-result-v1", JSON.stringify(result)); } catch {}
        navigate({ to: "/result" });
      }
    };
    raf = requestAnimationFrame(tick);

    return () => { clearInterval(stageTimer); cancelAnimationFrame(raf); };
  }, [navigate]);

  return (
    <main className="relative min-h-screen px-5 pt-8 pb-12 max-w-2xl mx-auto flex flex-col">
      <MuteButton />

      <div className="font-mono text-[10px] tracking-[0.3em] text-electric uppercase animate-flicker">
        ◉ SIMULATION RUNNING
      </div>

      <div className="mt-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase">
          {STAGES[stage]}<span className="text-neon animate-pulse">_</span>
        </h1>
      </div>

      {/* Animated track */}
      <div className="mt-6">
        <MiniTrack progress={progress} animated />
      </div>

      {/* Telemetry waveform */}
      <div className="mt-4 hud-panel hud-corner p-4 relative overflow-hidden">
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Engine Telemetry</div>
        <svg viewBox="0 0 400 80" className="w-full h-20">
          <defs>
            <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.78 0.18 235)" />
              <stop offset="100%" stopColor="oklch(0.65 0.27 25)" />
            </linearGradient>
          </defs>
          <Waveform progress={progress} />
        </svg>
        {/* Scan line */}
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--color-electric)]/60 animate-scan" />
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          <span>Progress</span>
          <span className="text-electric tabular-nums">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, var(--color-electric), var(--color-neon))",
              boxShadow: "0 0 12px var(--color-neon)",
            }}
          />
        </div>
      </div>

      <div className="mt-auto pt-8 grid grid-cols-3 gap-3 text-center">
        {STAGES.map((s, i) => (
          <div key={s} className={`font-mono text-[9px] uppercase tracking-widest py-2 rounded border ${
            i <= stage ? "border-[var(--color-electric)] text-electric" : "border-border text-muted-foreground/50"
          }`}>
            {String(i + 1).padStart(2, "0")}
          </div>
        )).slice(0, 3)}
      </div>
    </main>
  );
}

function Waveform({ progress }: { progress: number }) {
  const points: string[] = [];
  const amp = 18 + progress * 16;
  for (let x = 0; x <= 400; x += 4) {
    const y = 40 + Math.sin((x / 400) * Math.PI * 8 + progress * 20) * amp * Math.sin((x / 400) * Math.PI);
    points.push(`${x},${y.toFixed(1)}`);
  }
  return <polyline points={points.join(" ")} fill="none" stroke="url(#wave)" strokeWidth="2" />;
}
