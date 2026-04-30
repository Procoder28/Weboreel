import { useEffect, useMemo, useState } from "react";
import { behavior } from "@/lib/behavior";
import { DodgeButton } from "./DodgeButton";

interface Profile {
  type: string;
  emoji: string;
  blurb: string;
}

function computeProfile(): Profile & {
  rushed: number;
  noticed: number;
} {
  const s = behavior.state;
  const total = Math.max(1, s.totalSectionsSeen);
  const rushed = Math.round((s.sectionsSkipped / total) * 100);
  const noticed = Math.round((s.sectionsRead / total) * 100);
  const imp = s.impatience;

  if (imp > 75)
    return {
      type: "The Impatient Mind",
      emoji: "🔥",
      blurb: "You moved like the answer was somewhere ahead. It wasn't.",
      rushed,
      noticed,
    };
  if (imp > 55)
    return {
      type: "The Skipper",
      emoji: "⚡",
      blurb: "Fast hands. You traded depth for distance.",
      rushed,
      noticed,
    };
  if (s.calm > 55 && noticed > 60)
    return {
      type: "The Deep Diver",
      emoji: "🌊",
      blurb: "You stayed long enough to be seen back.",
      rushed,
      noticed,
    };
  if (s.calm > 40)
    return {
      type: "The Observer",
      emoji: "👁️",
      blurb: "You watched the website watch you.",
      rushed,
      noticed,
    };
  return {
    type: "The Curious One",
    emoji: "🌌",
    blurb: "You paused just enough to notice things most people miss.",
    rushed,
    noticed,
  };
}

interface Props {
  onRestart: () => void;
}

export function Ending({ onRestart }: Props) {
  const profile = useMemo(() => computeProfile(), []);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const share = () => {
    const text = `I'm ${profile.type} ${profile.emoji} — I rushed through ${profile.rushed}% of the experience. slowdown.app`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => void 0);
    } else {
      navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
      <div className="mb-4 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        You reached the end
      </div>
      <div className="mb-6 text-6xl md:text-7xl breathing" aria-hidden>
        {profile.emoji}
      </div>
      <h2
        className="text-balance text-4xl font-light md:text-6xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        You are {profile.type}.
      </h2>
      <p className="mt-6 max-w-md text-lg text-muted-foreground">{profile.blurb}</p>

      <div className="mt-12 grid w-full max-w-md grid-cols-2 gap-4 text-left">
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Rushed through
          </div>
          <div
            className="mt-2 text-3xl font-light"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {profile.rushed}%
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Noticed
          </div>
          <div
            className="mt-2 text-3xl font-light"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {profile.noticed}%
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
        <DodgeButton onClick={share}>
          {copied ? "Copied ✓" : "Share result"}
        </DodgeButton>
        <DodgeButton variant="ghost" onClick={onRestart}>
          Try again
        </DodgeButton>
      </div>
    </section>
  );
}
