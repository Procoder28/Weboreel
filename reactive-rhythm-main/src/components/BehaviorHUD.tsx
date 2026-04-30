import { useBehavior } from "@/hooks/use-behavior";

export function BehaviorHUD() {
  const s = useBehavior();
  return (
    <div
      className="pointer-events-none fixed bottom-5 left-5 z-40 hidden select-none font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 md:block"
      aria-hidden
    >
      <div>Phase · {s.phase}</div>
      <div>Impatience · {Math.round(s.impatience)}</div>
      <div>Calm · {Math.round(s.calm)}</div>
    </div>
  );
}
