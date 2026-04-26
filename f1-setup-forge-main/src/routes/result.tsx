import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MuteButton } from "@/components/MuteButton";
import { MiniTrack } from "@/components/MiniTrack";
import { StatBar } from "@/components/StatBar";
import { RaceResult } from "@/lib/simulation";
import { playCheer, playFail, playPassBy, playPress, unlockAudio } from "@/lib/audio";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Race Result — Build Your F1 Car Setup" },
      { name: "description", content: "Your lap time, position estimate, performance breakdown and AI race-engineer feedback." },
    ],
  }),
  component: ResultScreen,
});

function ResultScreen() {
  const navigate = useNavigate();
  const [result, setResult] = useState<RaceResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    unlockAudio();
    let raw: string | null = null;
    try { raw = localStorage.getItem("f1-result-v1"); } catch {}
    if (!raw) { navigate({ to: "/setup" }); return; }
    const r = JSON.parse(raw) as RaceResult;
    setResult(r);

    // Audio sequence
    playPassBy();
    setTimeout(() => {
      if (r.overall >= 80) playCheer();
      else if (r.isPoor) playFail();
    }, 900);

    // Animate car around track
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = ((t - start) / 4000) % 1;
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [navigate]);

  if (!result) return null;

  const onShare = async () => {
    playPress();
    const text = `My F1 setup just clocked ${result.lapTimeStr} 🏎️ Finished P${result.position}. Can you beat it?`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Build Your F1 Car Setup", text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareMsg("Copied to clipboard");
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch {}
  };

  const positionColor = result.position === 1 ? "var(--color-amber)" : result.position <= 3 ? "var(--color-success)" : "var(--color-electric)";
  const podiumLabel = result.position === 1 ? "🏆 WINNER" : result.position === 2 ? "🥈 P2" : result.position === 3 ? "🥉 P3" : `P${result.position}`;

  return (
    <main className="relative min-h-screen px-5 pt-6 pb-12 max-w-2xl mx-auto">
      <MuteButton />

      <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex justify-between">
        <span className="text-success animate-flicker">◉ RACE COMPLETE</span>
        <span>FINAL TELEMETRY</span>
      </div>

      {/* Hero result */}
      <div className="mt-4 hud-panel hud-corner scanlines p-6 relative overflow-hidden animate-count-up">
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Lap Time</div>
        <div
          className="font-display font-black text-5xl sm:text-6xl tabular-nums mt-2"
          style={{ color: "var(--color-neon)", textShadow: "0 0 24px oklch(0.68 0.28 22 / 0.7)" }}
        >
          {result.lapTimeStr}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Position</div>
            <div className="font-display font-bold text-2xl mt-1" style={{ color: positionColor, textShadow: `0 0 16px ${positionColor}` }}>
              {podiumLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Overall</div>
            <div className="font-mono font-bold text-2xl text-electric tabular-nums mt-1">{result.overall}<span className="text-base opacity-60">/100</span></div>
          </div>
        </div>
      </div>

      {/* Track replay */}
      <div className="mt-4">
        <MiniTrack progress={progress} animated />
      </div>

      {/* Performance breakdown */}
      <div className="mt-4 hud-panel hud-corner p-5 animate-count-up" style={{ animationDelay: "0.1s" }}>
        <div className="font-display text-xs tracking-[0.25em] uppercase mb-4">Performance Breakdown</div>
        <div className="space-y-4">
          <StatBar label="Speed" value={result.speed} color="electric" />
          <StatBar label="Handling" value={result.handling} color="neon" />
          <StatBar label="Tire Strategy" value={result.tireStrategy} color="amber" />
        </div>
      </div>

      {/* AI feedback */}
      <div className="mt-4 hud-panel hud-corner p-5 animate-count-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-electric)] animate-pulse" />
          <span className="font-display text-xs tracking-[0.25em] uppercase">Race Engineer</span>
        </div>
        <ul className="space-y-2.5">
          {result.feedback.map((f, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-snug">
              <span className="text-neon font-mono mt-0.5">▸</span>
              <span className="text-foreground/90">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-6 grid gap-3">
        <button
          onClick={onShare}
          className="px-6 py-4 rounded-md font-display font-bold text-sm tracking-[0.2em] uppercase text-primary-foreground glow-electric transition-transform active:scale-[0.98]"
          style={{ background: "var(--gradient-electric)" }}
        >
          {shareMsg ?? "📤 Share My Setup"}
        </button>
        <Link
          to="/setup"
          onClick={() => playPress()}
          className="text-center px-6 py-4 rounded-md font-display font-bold text-sm tracking-[0.2em] uppercase border border-[var(--color-neon)] text-neon hover:bg-[oklch(0.65_0.27_25_/_0.1)] transition-colors"
        >
          ↻ Tune & Retry
        </Link>
        <Link
          to="/"
          onClick={() => playPress()}
          className="text-center font-mono text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          ◂ Back to Garage
        </Link>
      </div>
    </main>
  );
}
