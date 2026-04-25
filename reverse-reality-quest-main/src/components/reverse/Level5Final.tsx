import { useEffect, useRef, useState } from "react";
import { clickReversed, errorBlip } from "@/lib/audio";
import { pushToast } from "./Toast";

type Props = { onComplete: () => void; timeLimitMs?: number };

// Level 5 (Final) — Mixed chaos with time pressure.
// - Cursor/touch moves a dot INVERSELY.
// - Reach the goal ring.
// - A "STOP" button in the corner that, if you click it, actually advances time faster (lying button).
// - Time limit; if you fail, retry.
export function Level5Final({ onComplete, timeLimitMs = 30000 }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [dot, setDot] = useState({ x: 50, y: 80 });
  const [target] = useState({ x: 50, y: 15 });
  const last = useRef<{ x: number; y: number } | null>(null);
  const [remaining, setRemaining] = useState(timeLimitMs);
  const remRef = useRef(timeLimitMs);
  remRef.current = remaining;
  const finished = useRef(false);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;

    function apply(clientX: number, clientY: number) {
      const rect = el!.getBoundingClientRect();
      const px = ((clientX - rect.left) / rect.width) * 100;
      const py = ((clientY - rect.top) / rect.height) * 100;
      if (last.current) {
        const dx = px - last.current.x;
        const dy = py - last.current.y;
        setDot((d) => ({
          x: Math.max(2, Math.min(98, d.x - dx * 1.5)),
          y: Math.max(2, Math.min(98, d.y - dy * 1.5)),
        }));
      }
      last.current = { x: px, y: py };
    }

    function onMove(e: MouseEvent) { apply(e.clientX, e.clientY); }
    function onTouch(e: TouchEvent) {
      const t = e.touches[0];
      if (t) { e.preventDefault(); apply(t.clientX, t.clientY); }
    }
    function reset() { last.current = null; }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("touchmove", onTouch, { passive: false });
    el.addEventListener("mouseleave", reset);
    el.addEventListener("touchend", reset);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("touchmove", onTouch);
      el.removeEventListener("mouseleave", reset);
      el.removeEventListener("touchend", reset);
    };
  }, []);

  // Timer
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = now - prev;
      prev = now;
      if (!finished.current) {
        setRemaining((r) => {
          const next = r - dt;
          if (next <= 0) {
            // Reset on timeout
            errorBlip();
            pushToast("time bent against you. retry.");
            setDot({ x: 50, y: 80 });
            return timeLimitMs;
          }
          return next;
        });
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timeLimitMs]);

  // Win check
  useEffect(() => {
    if (finished.current) return;
    if (Math.hypot(dot.x - target.x, dot.y - target.y) < 6) {
      finished.current = true;
      clickReversed();
      setTimeout(onComplete, 400);
    }
  }, [dot, target, onComplete]);

  function handleStop() {
    // Lying button — burns 4 seconds
    errorBlip();
    pushToast("the button lied. time burned.");
    setRemaining((r) => Math.max(500, r - 4000));
  }

  const pct = Math.max(0, Math.min(1, remaining / timeLimitMs));
  const danger = pct < 0.3;

  return (
    <div
      ref={areaRef}
      className={`relative h-full w-full touch-none bg-chaos scanlines transition-colors ${danger ? "bg-[oklch(0.12_0.06_25/0.9)]" : ""}`}
    >
      <div className="absolute inset-x-0 top-16 flex flex-col items-center gap-2 px-6 text-center">
        <p className={`font-mono text-xs uppercase tracking-[0.3em] ${danger ? "text-destructive animate-urgency" : "text-muted-foreground"}`}>
          everything is reversed · reach the ring
        </p>
        <div className={`h-1 w-48 overflow-hidden rounded-full bg-border/60 ${danger ? "animate-urgency" : ""}`}>
          <div
            style={{ width: `${pct * 100}%` }}
            className={`h-full rounded-full transition-[width] duration-75 ${danger ? "bg-destructive" : "bg-accent"}`}
          />
        </div>
        <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${danger ? "text-destructive" : "text-muted-foreground"}`}>
          {(remaining / 1000).toFixed(1)}s
        </p>
      </div>

      <div
        style={{ left: `${target.x}%`, top: `${target.y}%` }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full border-2 border-dashed border-accent/80 pulse-glow"
      />
      <div
        style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary shadow-glow"
      />

      <button
        onClick={handleStop}
        className="absolute bottom-6 left-6 rounded-full border border-destructive/50 bg-destructive/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] text-destructive hover:bg-destructive/20 active:animate-shake"
      >
        STOP TIME
      </button>
    </div>
  );
}
