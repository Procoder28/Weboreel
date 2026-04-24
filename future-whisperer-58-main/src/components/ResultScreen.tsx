import { useEffect, useState } from "react";
import { Share2, RotateCcw, Users, Sparkles } from "lucide-react";
import type { FutureResult } from "@/server/generateFuture";
import { StatBar } from "./StatBar";

function vibeBackdrop(vibe: FutureResult["vibe"]): string {
  // Pure CSS gradients keyed to vibe — no external image needed, fast.
  switch (vibe) {
    case "luxurious":
      return "radial-gradient(ellipse at 30% 20%, oklch(0.4 0.18 320) 0%, oklch(0.1 0.05 280) 60%), radial-gradient(ellipse at 80% 80%, oklch(0.35 0.15 30) 0%, transparent 60%)";
    case "ambitious":
      return "radial-gradient(ellipse at 70% 30%, oklch(0.4 0.2 260) 0%, oklch(0.08 0.04 280) 65%), radial-gradient(ellipse at 20% 90%, oklch(0.35 0.18 200) 0%, transparent 55%)";
    case "serene":
      return "radial-gradient(ellipse at 50% 30%, oklch(0.45 0.12 220) 0%, oklch(0.1 0.04 260) 70%), radial-gradient(ellipse at 80% 90%, oklch(0.4 0.15 180) 0%, transparent 60%)";
    case "creative":
      return "radial-gradient(ellipse at 30% 70%, oklch(0.45 0.22 340) 0%, oklch(0.1 0.05 290) 65%), radial-gradient(ellipse at 80% 20%, oklch(0.4 0.2 50) 0%, transparent 55%)";
    case "chaotic":
      return "radial-gradient(ellipse at 20% 30%, oklch(0.4 0.22 25) 0%, oklch(0.08 0.05 290) 60%), radial-gradient(ellipse at 80% 70%, oklch(0.4 0.22 300) 0%, transparent 55%)";
    case "nomadic":
      return "radial-gradient(ellipse at 40% 40%, oklch(0.45 0.18 60) 0%, oklch(0.1 0.05 270) 65%), radial-gradient(ellipse at 80% 80%, oklch(0.4 0.18 240) 0%, transparent 55%)";
  }
}

function useTypewriter(text: string, speed = 22) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

const year = new Date().getFullYear() + 10;

export function ResultScreen({
  result,
  onRetry,
}: {
  result: FutureResult;
  onRetry: () => void;
}) {
  const story = useTypewriter(result.story, 18);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.([20, 40, 20]); } catch {}
    }
  }, []);

  const share = async () => {
    const text = `My Life in ${year}: "${result.title}" — ${result.story.slice(0, 120)}…`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: `My Life in ${year}`, text, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto py-8">
      {/* Cinematic backdrop */}
      <div
        className="fixed inset-0 -z-10 animate-zoom-slow"
        style={{ backgroundImage: vibeBackdrop(result.vibe) }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0.05_0.03_280/0.6)_100%)]" aria-hidden />

      {/* Title strip */}
      <div className="text-center mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs uppercase tracking-[0.3em] text-secondary mb-4">
          <Sparkles className="h-3 w-3" />
          Your Life in {year}
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold leading-[1.05] text-gradient">
          {result.title}
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.25em] text-muted-foreground font-display">
          {result.setting}
        </p>
      </div>

      {/* Story card */}
      <div className="glass-strong rounded-3xl p-6 sm:p-10 mb-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <p className="text-lg sm:text-xl leading-relaxed text-foreground/95 font-light min-h-[10rem]">
          {story}
          {story.length < result.story.length && (
            <span className="inline-block w-[2px] h-5 bg-secondary ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="glass rounded-3xl p-6 sm:p-8 mb-6 animate-fade-up" style={{ animationDelay: "500ms" }}>
        <div className="flex items-baseline justify-between mb-5">
          <h3 className="font-display text-sm uppercase tracking-[0.25em] text-foreground/80">
            Life Stats
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
            {result.wealthLabel}
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <StatBar label="Wealth" value={result.wealth} color="primary" />
          <StatBar label="Happiness" value={result.happiness} color="secondary" />
          <StatBar label="Work-Life Balance" value={result.balance} color="accent" />
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "700ms" }}>
        <button
          onClick={share}
          className="group relative overflow-hidden rounded-2xl bg-aurora text-primary-foreground px-5 py-4 font-semibold transition hover:scale-[1.02] glow-violet"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Share2 className="h-4 w-4" />
            {shared ? "Copied!" : "Share Your Future"}
          </span>
        </button>
        <button
          onClick={onRetry}
          className="rounded-2xl glass px-5 py-4 font-medium transition hover:bg-white/[0.08] flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-4 w-4" /> Try Again
        </button>
        <button
          onClick={share}
          className="rounded-2xl glass px-5 py-4 font-medium transition hover:bg-white/[0.08] flex items-center justify-center gap-2"
        >
          <Users className="h-4 w-4" /> Compare
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground/70 font-display tracking-[0.2em] uppercase">
        Generated by AI · Your future is unwritten
      </p>
    </div>
  );
}