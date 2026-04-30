import { useEffect, useState } from "react";
import { DodgeButton } from "./DodgeButton";

interface Props {
  onEnter: () => void;
}

export function Intro({ onEnter }: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-2xl">
      <div className="max-w-xl px-6 text-center">
        <div className="mb-6 text-[10px] uppercase tracking-[0.5em] text-muted-foreground breathing">
          Slow Down · An Experiment
        </div>
        <h1
          className="text-balance text-5xl font-light leading-[1.02] md:text-7xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Take your time.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
          This experience notices how you interact. Sound on — headphones
          recommended.
        </p>
        <div
          className="mt-12 transition-opacity duration-1000"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <DodgeButton onClick={onEnter}>Enter slowly</DodgeButton>
        </div>
      </div>
    </div>
  );
}
