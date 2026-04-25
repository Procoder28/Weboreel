import { useEffect, useRef, useState } from "react";
import { clickReversed } from "@/lib/audio";
import { pushToast } from "./Toast";

type Props = { onComplete: () => void };

// Level 2 — the dot follows the INVERSE of cursor/touch movement.
// Guide it into the target ring.
export function Level2Inverse({ onComplete }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [dot, setDot] = useState({ x: 50, y: 50 });
  const [target] = useState(() => ({
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
  }));
  const last = useRef<{ x: number; y: number } | null>(null);
  const dotRef = useRef(dot);
  dotRef.current = dot;
  const done = useRef(false);

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
        setDot((d) => {
          const nx = Math.max(2, Math.min(98, d.x - dx * 1.4));
          const ny = Math.max(2, Math.min(98, d.y - dy * 1.4));
          return { x: nx, y: ny };
        });
      }
      last.current = { x: px, y: py };
    }

    function onMove(e: MouseEvent) { apply(e.clientX, e.clientY); }
    function onTouch(e: TouchEvent) {
      const t = e.touches[0];
      if (t) {
        e.preventDefault();
        apply(t.clientX, t.clientY);
      }
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

  useEffect(() => {
    if (done.current) return;
    if (Math.hypot(dot.x - target.x, dot.y - target.y) < 5) {
      done.current = true;
      clickReversed();
      pushToast("you adapted to inversion");
      setTimeout(onComplete, 500);
    }
  }, [dot, target, onComplete]);

  return (
    <div ref={areaRef} className="relative h-full w-full touch-none scanlines">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          the dot moves <span className="text-primary">against</span> you · land it in the ring
        </p>
      </div>
      <div
        style={{ left: `${target.x}%`, top: `${target.y}%` }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full border-2 border-dashed border-accent/70"
      />
      <div
        style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary shadow-glow"
      />
    </div>
  );
}
