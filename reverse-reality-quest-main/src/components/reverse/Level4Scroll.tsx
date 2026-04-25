import { useEffect, useRef, useState } from "react";
import { clickReversed } from "@/lib/audio";
import { pushToast } from "./Toast";

type Props = { onComplete: () => void };

// Level 4 — Reverse scroll/swipe. Scroll DOWN actually moves the page UP.
// User must reach the hidden "GOAL" section at the bottom.
export function Level4Scroll({ onComplete }: Props) {
  const [offset, setOffset] = useState(0); // 0 (top) → maxOffset (bottom)
  const maxOffset = 1600;
  const offsetRef = useRef(0);
  const done = useRef(false);
  offsetRef.current = offset;

  useEffect(() => {
    function clamp(v: number) { return Math.max(0, Math.min(maxOffset, v)); }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      // Inverted: scrolling down (deltaY > 0) moves UP (decrease offset → less progress)
      setOffset((o) => clamp(o - e.deltaY));
    }
    let lastTouchY: number | null = null;
    function onTouchStart(e: TouchEvent) { lastTouchY = e.touches[0]?.clientY ?? null; }
    function onTouchMove(e: TouchEvent) {
      const y = e.touches[0]?.clientY;
      if (y == null || lastTouchY == null) return;
      e.preventDefault();
      const dy = y - lastTouchY;
      lastTouchY = y;
      // Swipe up (dy < 0) normally scrolls down → invert: swipe up moves down (increase offset? no, invert)
      // Original: dy < 0 means content moves up. Inverted: content moves down → offset decreases.
      setOffset((o) => clamp(o + dy));
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    if (!done.current && offset >= maxOffset - 4) {
      done.current = true;
      clickReversed();
      pushToast("found the hidden floor");
      setTimeout(onComplete, 500);
    }
  }, [offset, onComplete]);

  const progress = Math.round((offset / maxOffset) * 100);

  return (
    <div className="relative h-full w-full overflow-hidden touch-none scanlines">
      <div
        style={{ transform: `translateY(${-offset}px)` }}
        className="absolute inset-x-0 top-0 transition-transform duration-75 ease-out"
      >
        <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">scroll inverted</p>
          <h2 className="text-3xl font-display">Reach the bottom.</h2>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">scroll the wrong way</p>
        </div>
        <div className="flex h-[600px] flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
          <p className="font-mono text-xs uppercase tracking-[0.3em]">keep going · against instinct</p>
        </div>
        <div className="flex h-[500px] flex-col items-center justify-center gap-2 px-6 text-center">
          <h3 className="font-display text-5xl text-primary text-glow">GOAL</h3>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">you're here</p>
        </div>
      </div>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex h-40 w-1 flex-col rounded-full bg-border/60">
        <div
          style={{ height: `${progress}%` }}
          className="w-full rounded-full bg-primary shadow-glow transition-all"
        />
      </div>
    </div>
  );
}
