import { useEffect, useState } from "react";

const STEPS = [
  "Analyzing your choices",
  "Projecting life path",
  "Simulating future timeline",
  "Rendering your 2036",
];

export function AnalyzingScreen({ progress }: { progress: number }) {
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    const i = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));
    setStepIdx(i);
  }, [progress]);

  return (
    <div className="relative w-full max-w-md mx-auto text-center animate-fade-in-slow">
      {/* Floating orbs */}
      <div className="relative h-40 mb-10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-32 w-32">
            <div className="absolute inset-0 rounded-full bg-aurora opacity-30 blur-2xl animate-pulse-glow" />
            <div className="absolute inset-2 rounded-full glass-strong animate-float flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-secondary glow-blue animate-pulse" />
            </div>
            {/* Orbiting particles */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: `${6 + i * 2}s`, animationDirection: i % 2 ? "reverse" : "normal" }}
              >
                <div
                  className="absolute h-2 w-2 rounded-full bg-primary glow-violet"
                  style={{ top: `${i * 10}%`, left: "50%", transform: "translateX(-50%)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="font-display text-xs uppercase tracking-[0.3em] text-secondary mb-3">
        Simulation in progress
      </div>
      <div className="h-7 mb-6">
        <p key={stepIdx} className="animate-fade-up text-lg text-foreground/90">
          {STEPS[stepIdx]}<span className="animate-pulse">…</span>
        </p>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden glass">
        <div
          className="h-full bg-aurora transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground font-mono">
        {Math.round(progress)}%
      </div>
    </div>
  );
}