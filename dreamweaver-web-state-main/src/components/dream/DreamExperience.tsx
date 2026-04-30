import { useEffect, useMemo, useRef, useState } from "react";
import { useIdleDream } from "@/hooks/useIdleDream";
import { useDreamAudio } from "@/hooks/useDreamAudio";
import { ParticleField } from "@/components/dream/ParticleField";
import { CursorTrail } from "@/components/dream/CursorTrail";
import { FRAGMENTS, WORLDS, WORLD_LABEL, type World } from "@/components/dream/fragments";

type Stage = "landing" | "experience" | "ending";

export function DreamExperience() {
  const [stage, setStage] = useState<Stage>("landing");
  const [world, setWorld] = useState<World>("ocean");
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [visitedWorlds, setVisitedWorlds] = useState<Set<World>>(new Set());
  const [whisper, setWhisper] = useState<string | null>(null);
  const [interrupted, setInterrupted] = useState(false);
  const interruptTimer = useRef<number | null>(null);

  const { phase, activity } = useIdleDream({ driftMs: 7000, dreamMs: 12000 });
  const audioEnabled = stage !== "landing";
  const { chime } = useDreamAudio(phase, audioEnabled);

  // Rotate world each time we enter a fresh dream
  const prevPhase = useRef(phase);
  useEffect(() => {
    if (prevPhase.current !== "dreaming" && phase === "dreaming") {
      const next = WORLDS[Math.floor(Math.random() * WORLDS.length)];
      setWorld(next);
      setVisitedWorlds((s) => new Set(s).add(next));
      chime(440 + Math.random() * 220);
    }
    if (prevPhase.current === "dreaming" && phase !== "dreaming") {
      // interrupt feedback
      setInterrupted(true);
      if (interruptTimer.current) window.clearTimeout(interruptTimer.current);
      interruptTimer.current = window.setTimeout(() => setInterrupted(false), 1400);
    }
    prevPhase.current = phase;
  }, [phase, chime]);

  // Whisper rotation in dream
  useEffect(() => {
    if (phase !== "dreaming" || stage !== "experience") {
      setWhisper(null);
      return;
    }
    const pool = FRAGMENTS[world];
    let i = 0;
    const show = () => {
      const line = pool[i % pool.length];
      setWhisper(line);
      setDiscovered((s) => new Set(s).add(line));
      i++;
    };
    show();
    const id = window.setInterval(show, 7000);
    return () => window.clearInterval(id);
  }, [phase, world, stage]);

  // Drift state — subtle hint
  const driftHint = phase === "drifting";

  const bgClass = useMemo(() => {
    if (phase !== "dreaming") return "bg-awake";
    return world === "ocean" ? "bg-ocean" : world === "cosmic" ? "bg-cosmic" : "bg-liminal";
  }, [phase, world]);

  const dreamFilter =
    phase === "dreaming"
      ? "saturate(1.15) blur(0.3px)"
      : phase === "drifting"
      ? "saturate(1.05)"
      : "none";

  if (stage === "landing") {
    return <Landing onEnter={() => setStage("experience")} />;
  }

  if (stage === "ending") {
    return (
      <Ending
        discovered={Array.from(discovered)}
        worlds={Array.from(visitedWorlds)}
        onReturn={() => setStage("experience")}
      />
    );
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-dream ${bgClass}`}
      style={{ filter: dreamFilter }}
    >
      <ParticleField phase={phase} world={world} />
      <CursorTrail active={phase !== "awake"} />

      {/* Phase indicator (subtle, top-left) */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 rounded-full transition-all duration-1000 ${
              phase === "awake"
                ? "bg-primary"
                : phase === "drifting"
                ? "bg-accent animate-breathe"
                : "bg-glow animate-pulse-glow"
            }`}
          />
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {phase === "awake" ? "awake" : phase === "drifting" ? "drifting" : WORLD_LABEL[world]}
          </span>
        </div>
        <button
          onClick={() => setStage("ending")}
          className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
        >
          leave
        </button>
      </header>

      {/* Content */}
      <section className="relative z-10 px-6 md:px-12 pt-12 md:pt-24 pb-32 max-w-3xl mx-auto">
        <h1
          className={`font-display text-5xl md:text-7xl leading-[1.05] mb-8 transition-all duration-[2000ms] ${
            phase === "dreaming" ? "text-glow opacity-90" : "opacity-100"
          }`}
        >
          {phase === "dreaming"
            ? "you stayed."
            : driftHint
            ? "are you still there?"
            : "stay awhile."}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-16">
          {phase === "dreaming"
            ? "the website is dreaming. move slowly, and it will keep showing you things."
            : "this place changes when nobody is watching. stop moving. listen."}
        </p>

        {/* Awake content */}
        {phase === "awake" && (
          <div className="grid gap-6 md:grid-cols-2 animate-slow-fade-in">
            {[
              { t: "I.", l: "A quiet interface." },
              { t: "II.", l: "It waits patiently." },
              { t: "III.", l: "It notices when you stop." },
              { t: "IV.", l: "And then it begins." },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm p-6 hover:border-accent/60 transition-colors"
              >
                <div className="font-display text-3xl text-accent mb-2">{c.t}</div>
                <div className="text-foreground/80">{c.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Dream interactive elements */}
        {phase === "dreaming" && (
          <DreamObjects world={world} onTap={(f) => chime(f)} />
        )}
      </section>

      {/* Whisper layer */}
      {whisper && phase === "dreaming" && (
        <div
          key={whisper}
          className="pointer-events-none fixed inset-x-0 bottom-24 flex justify-center px-6 z-20"
        >
          <p className="font-display italic text-2xl md:text-3xl text-center text-foreground/90 text-glow animate-whisper-in max-w-2xl">
            {whisper}
          </p>
        </div>
      )}

      {/* Interrupt flash */}
      {interrupted && (
        <div className="pointer-events-none fixed inset-0 z-30 bg-background/40 animate-slow-fade-in flex items-center justify-center">
          <p className="font-display italic text-xl text-muted-foreground">
            you interrupted it.
          </p>
        </div>
      )}

      {/* Activity-reactive vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, oklch(0.08 0.04 270 / 0.7) 100%)",
          opacity: phase === "dreaming" ? 1 : 0.4,
          mixBlendMode: "multiply",
        }}
      />

      {/* fast-motion shake */}
      {activity > 0.4 && phase === "dreaming" && (
        <div className="pointer-events-none fixed inset-0 z-[2]" style={{ backdropFilter: "blur(2px)" }} />
      )}
    </main>
  );
}

function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-awake flex items-center justify-center px-6">
      <ParticleField phase="awake" world="ocean" />
      <div className="relative z-10 text-center max-w-xl animate-slow-fade-in">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-6">
          when the website dreams
        </p>
        <h1 className="font-display text-6xl md:text-8xl leading-[1] mb-6 text-glow">
          stay awhile.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-12 italic font-display">
          the website changes when nobody is watching.
        </p>
        <button
          onClick={onEnter}
          className="group relative inline-flex items-center justify-center rounded-full border border-accent/60 bg-accent/10 px-10 py-4 text-sm uppercase tracking-[0.3em] text-foreground hover:bg-accent/30 transition-all duration-700 animate-pulse-glow"
        >
          enter
          <span className="ml-3 transition-transform group-hover:translate-x-1">→</span>
        </button>
        <p className="mt-10 text-xs text-muted-foreground/70">
          best with sound · headphones recommended
        </p>
      </div>
    </main>
  );
}

function DreamObjects({ world, onTap }: { world: World; onTap: (f: number) => void }) {
  const objects = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        top: 10 + Math.random() * 60,
        left: Math.random() * 80,
        size: 40 + Math.random() * 80,
        delay: Math.random() * 4,
        freq: 330 + Math.random() * 500,
      })),
    [world]
  );

  return (
    <div className="relative h-[40vh]">
      {objects.map((o) => (
        <button
          key={o.id}
          onClick={() => onTap(o.freq)}
          className="absolute rounded-full border border-foreground/20 bg-foreground/5 backdrop-blur-md hover:bg-foreground/15 hover:scale-110 transition-all duration-700 animate-drift"
          style={{
            top: `${o.top}%`,
            left: `${o.left}%`,
            width: o.size,
            height: o.size,
            animationDelay: `${o.delay}s`,
            boxShadow: "0 0 40px oklch(0.85 0.15 250 / 0.3), inset 0 0 30px oklch(0.85 0.15 250 / 0.2)",
          }}
          aria-label="dream object"
        />
      ))}
    </div>
  );
}

function Ending({
  discovered,
  worlds,
  onReturn,
}: {
  discovered: string[];
  worlds: World[];
  onReturn: () => void;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-awake flex items-center justify-center px-6 py-16">
      <ParticleField phase="dreaming" world="cosmic" />
      <div className="relative z-10 max-w-2xl w-full animate-slow-fade-in">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-6 text-center">
          you stayed long enough
        </p>
        <h1 className="font-display text-5xl md:text-7xl text-center mb-10 text-glow leading-tight">
          what the website saw.
        </h1>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 md:p-8 mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            worlds visited
          </div>
          {worlds.length === 0 ? (
            <p className="text-muted-foreground italic">none yet — you didn't stop moving.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {worlds.map((w) => (
                <span
                  key={w}
                  className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm text-foreground"
                >
                  {WORLD_LABEL[w]}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 md:p-8 mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            fragments discovered ({discovered.length})
          </div>
          {discovered.length === 0 ? (
            <p className="text-muted-foreground italic">
              the website kept its secrets this time.
            </p>
          ) : (
            <ul className="space-y-3">
              {discovered.map((d) => (
                <li
                  key={d}
                  className="font-display italic text-lg md:text-xl text-foreground/90"
                >
                  · {d}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={onReturn}
            className="rounded-full border border-accent/60 bg-accent/10 px-8 py-3 text-sm uppercase tracking-[0.3em] hover:bg-accent/30 transition-colors"
          >
            enter again
          </button>
          <button
            onClick={() => {
              const text = "this website started dreaming when i stopped moving… 🌌";
              if (navigator.share) {
                navigator.share({ title: "When The Website Dreams", text }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(text);
              }
            }}
            className="rounded-full border border-border bg-card/40 px-8 py-3 text-sm uppercase tracking-[0.3em] hover:border-accent/60 transition-colors"
          >
            share the dream
          </button>
        </div>
      </div>
    </main>
  );
}
