import { useEffect } from "react";
import { startCalm, stopCalm, successChime } from "@/lib/audio";

type Props = { timeMs: number; onRestart: () => void };

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function WinScreen({ timeMs, onRestart }: Props) {
  useEffect(() => {
    successChime();
    startCalm();
    return () => stopCalm();
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-calm px-6 text-center">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.85_0.18_155/0.18),transparent_60%)]" />
      <div className="animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground">complete</p>
        <h1 className="mt-4 font-display text-5xl sm:text-7xl text-primary text-glow">You adapted.</h1>
        <p className="mt-6 font-display text-xl sm:text-2xl text-foreground/90">Humans are powerful.</p>
        <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-primary/40 bg-background/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] text-primary backdrop-blur-md">
          <span className="text-muted-foreground">time</span>
          <span>{formatTime(timeMs)}</span>
        </div>
        <div className="mt-12">
          <button
            onClick={onRestart}
            className="rounded-full border border-border/60 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground transition hover:text-primary hover:border-primary/60"
          >
            ↺ play again
          </button>
        </div>
      </div>
    </div>
  );
}
