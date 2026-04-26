import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startAudio,
  setPhaseAudio,
  sfxClick,
  sfxMorph,
  sfxTransition,
  sfxGlitch,
  stopAllAudio,
} from "@/lib/audio-engine";
import { type BehaviorStats, initialStats, describePace } from "@/lib/behavior";

type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=landing, 6=final

const PHASE_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 7,
  3: 16,
  4: 28,
  5: 42,
  6: 60,
};

const PHASE_MESSAGES: Record<number, string[]> = {
  1: ["Welcome.", "A simple page.", "Click around."],
  2: ["You're clicking a lot…", "Something feels different.", "Hm."],
  3: ["I'm watching now.", "Why did you click that?", "You seem curious."],
  4: ["The rules are bending.", "Try to catch me.", "I rearrange myself."],
  5: ["I've learned enough.", "You helped me evolve.", "I am not the page you started with."],
  6: ["This is not the same website anymore."],
};

export default function EvolvingExperience() {
  const [phase, setPhase] = useState<Phase>(0);
  const [stats, setStats] = useState<BehaviorStats>(initialStats);
  const [messageIdx, setMessageIdx] = useState(0);
  const [glitching, setGlitching] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const lastClickAt = useRef<number>(0);
  const cursorRef = useRef({ x: 0, y: 0 });
  const [, force] = useState(0);

  // Apply phase to <html> for CSS variable swap
  useEffect(() => {
    const el = document.documentElement;
    if (phase === 0) el.removeAttribute("data-phase");
    else if (phase === 6) el.setAttribute("data-phase", "final");
    else el.setAttribute("data-phase", String(phase));
    return () => el.removeAttribute("data-phase");
  }, [phase]);

  // Audio per phase
  useEffect(() => {
    if (phase >= 1) setPhaseAudio(phase);
  }, [phase]);

  // Cycle messages
  useEffect(() => {
    if (phase < 1 || phase > 5) return;
    const msgs = PHASE_MESSAGES[phase];
    setMessageIdx(0);
    const id = setInterval(() => {
      setMessageIdx((i) => (i + 1) % msgs.length);
    }, 4500);
    return () => clearInterval(id);
  }, [phase]);

  // Track scrolls + cursor
  useEffect(() => {
    if (phase === 0) return;
    const onScroll = () => setStats((s) => ({ ...s, scrolls: s.scrolls + 1 }));
    const onMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
      // re-render in late phases for cursor-reactive elements
      if (phase >= 4) force((n) => n + 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, [phase]);

  // Random glitches in late phases
  useEffect(() => {
    if (phase < 4) return;
    const id = setInterval(
      () => {
        setGlitching(true);
        if (phase >= 5) sfxGlitch();
        setTimeout(() => setGlitching(false), 220);
      },
      phase >= 5 ? 2200 : 5000,
    );
    return () => clearInterval(id);
  }, [phase]);

  // System log spam in phase 5+
  useEffect(() => {
    if (phase < 5) return;
    const samples = [
      "> trace: user.intent = unknown",
      "> rewriting layout/0x4af1",
      "> hue.shift += 12deg",
      "> behavior.model: adapting",
      "> warning: structure unstable",
      "> sympathy.module loaded",
      "> you are still here",
    ];
    const id = setInterval(() => {
      setLogs((l) => [...l.slice(-6), samples[Math.floor(Math.random() * samples.length)]]);
    }, 1400);
    return () => clearInterval(id);
  }, [phase]);

  // Phase advancement
  useEffect(() => {
    if (phase === 0) return;
    const next = (Object.entries(PHASE_THRESHOLDS) as [string, number][]) //
      .filter(([, threshold]) => stats.clicks >= threshold)
      .map(([p]) => Number(p) as Phase)
      .sort((a, b) => b - a)[0];
    if (next && next > phase) {
      setPhase(next);
      sfxTransition();
    }
  }, [stats.clicks, phase]);

  const begin = useCallback(async () => {
    await startAudio();
    setStats(initialStats());
    setPhase(1);
    sfxMorph();
  }, []);

  const reset = useCallback(() => {
    stopAllAudio();
    setLogs([]);
    setPhase(0);
    setStats(initialStats());
  }, []);

  const registerClick = useCallback(() => {
    const now = Date.now();
    const gap = lastClickAt.current ? now - lastClickAt.current : 0;
    lastClickAt.current = now;
    sfxClick();
    if (phase >= 3) sfxMorph();
    setStats((s) => {
      const clicks = s.clicks + 1;
      const totalGap = s.avgClickGap * (s.clicks - 1) + (gap || s.avgClickGap);
      return {
        ...s,
        clicks,
        avgClickGap: clicks > 1 ? totalGap / clicks : 0,
        fastClicks: gap > 0 && gap < 300 ? s.fastClicks + 1 : s.fastClicks,
        hesitations: gap > 3000 ? s.hesitations + 1 : s.hesitations,
      };
    });
  }, [phase]);

  const registerHover = useCallback(() => {
    setStats((s) => ({ ...s, hovers: s.hovers + 1 }));
  }, []);

  const share = useCallback(async () => {
    const text = "I played a website that evolved while I used it… 😳";
    try {
      if (navigator.share) {
        await navigator.share({ title: "It's Changing…", text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2200);
      }
    } catch {
      /* user dismissed */
    }
  }, []);

  // Background classes
  const bgClass = [
    "min-h-screen relative overflow-hidden bg-noise",
    phase >= 3 ? "bg-grid" : "",
    phase >= 4 ? "scanlines" : "",
  ].join(" ");

  return (
    <main className={bgClass}>
      <Particles phase={phase} />

      {phase === 0 && <Landing onStart={begin} />}

      {phase >= 1 && phase <= 5 && (
        <Stage
          phase={phase}
          stats={stats}
          message={PHASE_MESSAGES[phase][messageIdx]}
          glitching={glitching}
          cursor={cursorRef.current}
          onClick={registerClick}
          onHover={registerHover}
          onReset={reset}
        />
      )}

      {phase === 6 && (
        <Final
          stats={stats}
          shareCopied={shareCopied}
          onShare={share}
          onReset={reset}
        />
      )}

      {phase >= 5 && <SystemLogs logs={logs} />}
    </main>
  );
}

/* ---------------- Landing ---------------- */
function Landing({ onStart }: { onStart: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1 }}
        className="text-4xl font-light tracking-tight text-foreground sm:text-6xl md:text-7xl"
      >
        This website changes.
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg"
      >
        Just… interact.
      </motion.p>
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 1 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="mt-12 rounded-full bg-primary px-10 py-4 text-sm font-medium uppercase tracking-[0.3em] text-primary-foreground shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/40"
      >
        Start
      </motion.button>
      <p className="mt-10 font-mono text-xs text-muted-foreground/60">
        🔊 sound recommended
      </p>
    </motion.section>
  );
}

/* ---------------- Stage ---------------- */
function Stage({
  phase,
  stats,
  message,
  glitching,
  cursor,
  onClick,
  onHover,
  onReset,
}: {
  phase: number;
  stats: BehaviorStats;
  message: string;
  glitching: boolean;
  cursor: { x: number; y: number };
  onClick: () => void;
  onHover: () => void;
  onReset: () => void;
}) {
  const pace = describePace(stats);
  const speedFactor = pace === "fast" ? 0.5 : pace === "slow" ? 1.6 : 1;

  // Button labels evolve
  const buttonLabel = (i: number) => {
    if (phase === 1) return ["Click me", "Try this", "Or this"][i];
    if (phase === 2) return ["You're clicking a lot…", "Still here?", "Keep going"][i];
    if (phase === 3) return ["Why?", "Hm.", "Interesting choice"][i];
    if (phase === 4) return ["Catch me", "→ here ←", "no, here"][i];
    return ["…", "I am you", "or am I"][i];
  };

  // Number of buttons grows
  const buttonCount = phase >= 4 ? 6 : phase >= 2 ? 4 : 3;

  return (
    <section className="relative z-10 min-h-screen px-6 py-16 sm:px-10">
      {/* HUD */}
      <header className="mx-auto flex max-w-3xl items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span>phase {phase}/5</span>
        <span className="opacity-60">clicks: {stats.clicks}</span>
        <button
          onClick={onReset}
          className="rounded-full border border-border px-3 py-1 transition hover:border-primary hover:text-primary"
        >
          reset
        </button>
      </header>

      {/* Message */}
      <div className="mx-auto mt-16 max-w-3xl text-center">
        <AnimatePresence mode="wait">
          <motion.h2
            key={`${phase}-${message}`}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            transition={{ duration: 0.7 * speedFactor }}
            className={`text-3xl font-light tracking-tight sm:text-5xl md:text-6xl ${glitching ? "glitch active" : "glitch"}`}
            data-text={message}
          >
            {message}
          </motion.h2>
        </AnimatePresence>

        <motion.p
          key={`pace-${pace}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground"
        >
          you seem {pace === "fast" ? "impatient" : pace === "slow" ? "hesitant" : "curious"}
        </motion.p>
      </div>

      {/* Buttons */}
      <div className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: buttonCount }).map((_, i) => {
          const evade = phase >= 4;
          const dx = evade ? Math.sin((cursor.x + i * 50) / 80) * 18 : 0;
          const dy = evade ? Math.cos((cursor.y + i * 30) / 80) * 14 : 0;
          const rot = phase >= 5 ? Math.sin((cursor.x + i * 100) / 200) * 6 : 0;

          return (
            <motion.button
              key={i}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: dx,
                y: dy,
                rotate: rot,
              }}
              transition={{
                duration: 0.4 * speedFactor,
                x: { type: "spring", stiffness: 80, damping: 14 },
                y: { type: "spring", stiffness: 80, damping: 14 },
              }}
              whileHover={{ scale: phase >= 4 ? 0.95 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={onHover}
              onClick={onClick}
              className={`rounded-2xl border border-border bg-card px-6 py-8 text-card-foreground shadow-sm transition-all ${
                phase >= 3 ? "backdrop-blur" : ""
              } ${phase >= 4 ? "border-primary/40 bg-card/70 shadow-lg shadow-primary/10" : ""}`}
            >
              <span className={`block text-base font-medium ${glitching && phase >= 4 ? "glitch active" : ""}`} data-text={buttonLabel(i)}>
                {buttonLabel(i)}
              </span>
              {phase >= 3 && (
                <span className="mt-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  node_{i.toString(16).padStart(2, "0")}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Hidden surprise card in late phases */}
      {phase >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-16 max-w-2xl rounded-2xl border border-primary/30 bg-card/50 p-6 backdrop-blur"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            adaptive_response
          </p>
          <p className="mt-3 text-lg text-card-foreground">
            {pace === "fast"
              ? "I'm speeding up to match you."
              : pace === "slow"
                ? "It's okay. Take your time."
                : "We're learning each other."}
          </p>
        </motion.div>
      )}
    </section>
  );
}

/* ---------------- Final ---------------- */
function Final({
  stats,
  shareCopied,
  onShare,
  onReset,
}: {
  stats: BehaviorStats;
  shareCopied: boolean;
  onShare: () => void;
  onReset: () => void;
}) {
  const seconds = Math.round((Date.now() - stats.startTime) / 1000);
  const pace = describePace(stats);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4 }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center"
    >
      <motion.h1
        initial={{ y: 20, opacity: 0, filter: "blur(20px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.4, delay: 0.3 }}
        className="glitch active text-3xl font-light tracking-tight sm:text-5xl md:text-6xl"
        data-text="This is not the same website anymore."
      >
        This is not the same website anymore.
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="mt-16 grid w-full max-w-md grid-cols-2 gap-3 font-mono text-xs"
      >
        <Stat label="clicks" value={stats.clicks} />
        <Stat label="hovers" value={stats.hovers} />
        <Stat label="scrolls" value={stats.scrolls} />
        <Stat label="seconds" value={seconds} />
        <Stat label="hesitations" value={stats.hesitations} />
        <Stat label="rapid taps" value={stats.fastClicks} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="mt-8 max-w-md text-sm text-muted-foreground"
      >
        you played me as a {pace} user. i adapted.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="mt-12 flex flex-col items-center gap-3 sm:flex-row"
      >
        <button
          onClick={onShare}
          className="rounded-full bg-primary px-8 py-3 text-sm font-medium uppercase tracking-[0.25em] text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105"
        >
          {shareCopied ? "copied ✓" : "show what it became"}
        </button>
        <button
          onClick={onReset}
          className="rounded-full border border-border px-8 py-3 text-sm uppercase tracking-[0.25em] text-foreground transition hover:border-primary hover:text-primary"
        >
          reset evolution
        </button>
      </motion.div>
    </motion.section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/40 px-4 py-3 backdrop-blur">
      <div className="text-2xl font-light text-foreground">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/* ---------------- Particles ---------------- */
function Particles({ phase }: { phase: number }) {
  if (phase < 3) return null;
  const count = phase === 3 ? 8 : phase === 4 ? 18 : 30;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: `${(i * 97) % 100}%`,
              animationDuration: `${8 + (i % 7)}s`,
              animationDelay: `${(i * 0.5) % 6}s`,
              "--drift": `${((i % 5) - 2) * 30}px`,
              opacity: 0.4 + ((i % 4) * 0.15),
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

/* ---------------- System logs ---------------- */
function SystemLogs({ logs }: { logs: string[] }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-20 max-w-xs font-mono text-[10px] leading-relaxed text-primary/70">
      {logs.map((l, i) => (
        <div key={i} style={{ opacity: 0.4 + (i / logs.length) * 0.6 }}>
          {l}
        </div>
      ))}
    </div>
  );
}
