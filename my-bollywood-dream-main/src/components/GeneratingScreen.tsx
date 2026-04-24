import { useEffect, useState } from "react";

const STAGES = [
  "Lighting the spotlights",
  "Casting the stars",
  "Writing your destiny",
  "Cueing the music",
  "Lights, camera, action",
];

export function GeneratingScreen() {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => Math.min(95, p + Math.random() * 4 + 1));
    }, 180);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setStage(Math.min(STAGES.length - 1, Math.floor((progress / 100) * STAGES.length)));
  }, [progress]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl animate-fade-in">
      <div className="text-center max-w-md px-6 space-y-10">
        <div className="font-display tracking-[0.4em] text-gold/80 text-xs uppercase">
          Now Showing
        </div>
        <div className="font-display text-5xl md:text-6xl gradient-gold-text glow-gold-lg animate-title-reveal">
          Presenting…
        </div>
        <div className="space-y-3">
          <div className="h-1 w-full bg-gold/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold via-gold-glow to-gold transition-all duration-200 ease-out"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 20px var(--gold)",
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground font-display tracking-widest uppercase">
            {STAGES[stage]}…
          </p>
        </div>
      </div>
    </div>
  );
}
