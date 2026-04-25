import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

const PHRASES = [
  "Analyzing your behavior…",
  "Calculating mental patterns…",
  "Comparing with global minds…",
  "Reading between the lines…",
];

interface Props {
  onDone: () => void;
  duration?: number;
}

export function Analyzing({ onDone, duration = 2600 }: Props) {
  const [progress, setProgress] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setProgress(p * 100);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onDone();
      }
    };
    raf = requestAnimationFrame(tick);

    const interval = window.setInterval(() => {
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    }, 800);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [duration, onDone]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-10">
        <div className="absolute inset-0 rounded-full blur-3xl bg-[var(--brand-purple)]/40 animate-pulse" />
        <div className="relative grid h-32 w-32 place-items-center rounded-full glass-card shadow-glow">
          <Brain className="h-14 w-14 text-[var(--brand-purple)] animate-bounce-slow" />
        </div>
      </div>

      <p
        key={phraseIdx}
        className="animate-pop-in text-xl sm:text-2xl font-bold text-foreground mb-8 min-h-[2.5rem]"
      >
        {PHRASES[phraseIdx]}
      </p>

      <div className="w-full max-w-xs h-2 rounded-full bg-white/40 overflow-hidden">
        <div
          className="h-full gradient-primary transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-foreground/60">{Math.round(progress)}%</p>
    </div>
  );
}