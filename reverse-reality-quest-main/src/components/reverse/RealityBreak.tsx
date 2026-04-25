import { useEffect, useState } from "react";
import { realityBreak } from "@/lib/audio";

type Props = { onDone: () => void };

// Dramatic "wow moment": full-screen glitch burst → flip/invert →
// brief slow-motion silence → trigger onDone (which leads to win screen).
export function RealityBreak({ onDone }: Props) {
  const [phase, setPhase] = useState<"burst" | "flip" | "calm">("burst");

  useEffect(() => {
    realityBreak();
    const t1 = setTimeout(() => setPhase("flip"), 900);
    const t2 = setTimeout(() => setPhase("calm"), 1900);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-background">
      {/* Burst layer */}
      {phase === "burst" && (
        <>
          <div className="absolute inset-0 rb-noise" />
          <div className="absolute inset-0 rb-bands" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1
              className="glitch font-display text-5xl sm:text-7xl font-bold text-foreground"
              data-text="REALITY.EXE"
            >
              REALITY.EXE
            </h1>
          </div>
        </>
      )}

      {/* Flip layer */}
      {phase === "flip" && (
        <div className="absolute inset-0 rb-flip">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.7_0.28_20/0.25),transparent_70%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.4em] text-accent">
              control · returning ·
            </p>
          </div>
        </div>
      )}

      {/* Calm transition */}
      {phase === "calm" && (
        <div className="absolute inset-0 rb-calm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.85_0.18_155/0.18),transparent_70%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.5em] text-primary/80">
              breathe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
