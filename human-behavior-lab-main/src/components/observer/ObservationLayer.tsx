import { useEffect, useState } from "react";

export type Observation = { id: number; text: string };

export function ObservationLayer({ observations }: { observations: Observation[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {observations.map((o) => (
        <ObservationLine key={o.id} text={o.text} />
      ))}
    </div>
  );
}

function ObservationLine({ text }: { text: string }) {
  const [pos] = useState(() => ({
    top: 15 + Math.random() * 60,
    left: 8 + Math.random() * 50,
  }));
  return (
    <div
      className="absolute obs-fade-in"
      style={{ top: `${pos.top}%`, left: `${pos.left}%`, animation: "obs-fade-in 1.2s ease-out, obs-fade-out 1.5s ease-in 3.2s forwards" }}
    >
      <p className="text-sm md:text-base tracking-[0.25em] uppercase text-foreground/90 obs-glitch">
        {text}
      </p>
      <div className="mt-1 h-px w-16 bg-[var(--observer-red)]/60" />
    </div>
  );
}