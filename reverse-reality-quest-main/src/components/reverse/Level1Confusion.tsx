import { useEffect, useRef, useState } from "react";
import { clickReversed, errorBlip } from "@/lib/audio";
import { pushToast } from "./Toast";

type Props = { onComplete: () => void };

// Level 1 — clicking spawns the action on the OPPOSITE side.
// Goal: hit the moving "Click Me" button 3 times, but clicks register at the mirrored x position.
export function Level1Confusion({ onComplete }: Props) {
  const [pos, setPos] = useState({ x: 50, y: 50 }); // percent
  const [hits, setHits] = useState(0);
  const [shake, setShake] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const target = 3;

  function move() {
    setPos({
      x: 15 + Math.random() * 70,
      y: 25 + Math.random() * 50,
    });
  }

  function handleAreaClick(e: React.MouseEvent) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    // Mirror horizontally — that's where the click "lands"
    const mx = 100 - cx;
    const my = cy;

    // Hit if mirrored point is within ~12% of target center
    const dx = mx - pos.x;
    const dy = my - pos.y;
    if (Math.hypot(dx, dy) < 12) {
      clickReversed();
      const next = hits + 1;
      setHits(next);
      pushToast("nice. mirror it.");
      if (next >= target) {
        setTimeout(onComplete, 400);
      } else {
        move();
      }
    } else {
      errorBlip();
      pushToast("try the opposite");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      move();
    }
  }

  return (
    <div
      ref={areaRef}
      onClick={handleAreaClick}
      className={`relative h-full w-full cursor-crosshair scanlines ${shake ? "animate-shake" : ""}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          clicks land on the <span className="text-primary">opposite</span> side · hit the button {target}× ({hits}/{target})
        </p>
      </div>
      <button
        type="button"
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60 bg-primary/10 px-6 py-3 font-mono text-sm uppercase tracking-[0.2em] text-primary shadow-glow transition-all duration-300 ease-out"
      >
        Click Me
      </button>
    </div>
  );
}
