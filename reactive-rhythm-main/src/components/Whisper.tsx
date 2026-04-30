import { useEffect, useState } from "react";
import { behavior } from "@/lib/behavior";
import { useBehavior } from "@/hooks/use-behavior";

// Timed whispers that react to phase + behavior.
const PHASE_LINES: Record<number, string[]> = {
  1: ["That was fast.", "You didn't read that, did you?", "Interesting…", "Hm."],
  2: [
    "You're moving quickly.",
    "Slow down. There's more here.",
    "Are you even looking?",
  ],
  3: [
    "Why are you in such a hurry?",
    "Most people skip the important parts.",
    "There's more if you slow down.",
  ],
  4: [
    "You missed it.",
    "Not everything reveals itself instantly.",
    "I hid something. You'll never know.",
  ],
  5: [
    "Stop.",
    "Breathe.",
    "I'll wait.",
  ],
};

export function Whisper() {
  const s = useBehavior();
  const [visible, setVisible] = useState<string | null>(null);
  const [lastPhase, setLastPhase] = useState(0);

  // Trigger on phase rise
  useEffect(() => {
    if (s.phase > lastPhase && s.phase > 0) {
      const lines = PHASE_LINES[s.phase];
      const line = lines[Math.floor(Math.random() * lines.length)];
      setVisible(line);
      behavior.setMessage(line);
      const to = setTimeout(() => setVisible(null), 4200);
      return () => clearTimeout(to);
    }
    setLastPhase(s.phase);
  }, [s.phase, lastPhase]);

  // Occasional scroll-speed whispers within a phase
  useEffect(() => {
    if (s.phase < 1) return;
    if (s.scrollSpeed > 3000 && !visible) {
      const lines = PHASE_LINES[Math.min(s.phase, 3) as 1 | 2 | 3];
      const line = lines[Math.floor(Math.random() * lines.length)];
      setVisible(line);
      const to = setTimeout(() => setVisible(null), 3000);
      return () => clearTimeout(to);
    }
  }, [s.scrollSpeed, s.phase, visible]);

  if (!visible) return null;
  const glitchy = s.phase >= 4;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-8 z-50 flex justify-center px-4">
      <div
        className="fade-up rounded-full border border-border/60 bg-card/70 px-5 py-2.5 text-sm font-light tracking-wide text-foreground/90 shadow-[var(--shadow-soft)] backdrop-blur-xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {glitchy ? (
          <span className="glitch-text" data-text={visible}>
            {visible}
          </span>
        ) : (
          visible
        )}
      </div>
    </div>
  );
}
