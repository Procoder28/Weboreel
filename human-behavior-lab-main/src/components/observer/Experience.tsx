import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CursorGlow } from "./CursorGlow";
import { ObservationLayer, type Observation } from "./ObservationLayer";
import {
  startAudio,
  setTension,
  playTick,
  playEerie,
  playReveal,
  playWhisperHover,
} from "@/lib/observer/audio";
import { initialMetrics, classifyProfile, type Metrics } from "@/lib/observer/tracker";

type Phase = "landing" | "intro" | "exploring" | "reveal";

const VISITED_KEY = "obs_visited";
const VISITOR_NUM_KEY = "obs_visitor_num";

export function Experience() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [tension, setTensionLevel] = useState(0);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [returning, setReturning] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  const metricsRef = useRef<Metrics>({ ...initialMetrics });
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastClickRef = useRef<number>(0);
  const idleTimerRef = useRef<number | null>(null);
  const obsIdRef = useRef(0);
  const recentAnglesRef = useRef<number[]>([]);
  const shownRef = useRef<Set<string>>(new Set());

  // Detect returning visitor
  useEffect(() => {
    if (typeof window === "undefined") return;
    const visited = localStorage.getItem(VISITED_KEY);
    if (visited) setReturning(true);
    localStorage.setItem(VISITED_KEY, "1");
    if (!localStorage.getItem(VISITOR_NUM_KEY)) {
      localStorage.setItem(VISITOR_NUM_KEY, String(40 + Math.floor(Math.random() * 80)));
    }
  }, []);

  const pushObservation = useCallback((text: string, soundFn?: () => void) => {
    if (shownRef.current.has(text)) return;
    shownRef.current.add(text);
    const id = ++obsIdRef.current;
    setObservations((prev) => [...prev, { id, text }]);
    soundFn?.();
    setTimeout(() => {
      setObservations((prev) => prev.filter((o) => o.id !== id));
    }, 5200);
  }, []);

  // Tracking
  useEffect(() => {
    if (phase === "landing") return;

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const last = lastMoveRef.current;
      metricsRef.current.lastInteractionAt = Date.now();
      metricsRef.current.hesitationMs = 0;
      if (last) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        const dt = Math.max(1, now - last.t);
        const dist = Math.hypot(dx, dy);
        const v = (dist / dt) * 1000;
        metricsRef.current.cursorVelocity =
          metricsRef.current.cursorVelocity * 0.85 + v * 0.15;
        metricsRef.current.totalDistance += dist;

        // Circle detection — track angle changes
        if (dist > 4) {
          const angle = Math.atan2(dy, dx);
          recentAnglesRef.current.push(angle);
          if (recentAnglesRef.current.length > 20) recentAnglesRef.current.shift();
          if (recentAnglesRef.current.length >= 12) {
            let totalDelta = 0;
            for (let i = 1; i < recentAnglesRef.current.length; i++) {
              let d = recentAnglesRef.current[i] - recentAnglesRef.current[i - 1];
              while (d > Math.PI) d -= 2 * Math.PI;
              while (d < -Math.PI) d += 2 * Math.PI;
              totalDelta += d;
            }
            if (Math.abs(totalDelta) > Math.PI * 1.5) {
              metricsRef.current.circleScore += 5;
              recentAnglesRef.current = [];
            }
          }
        }
      }
      lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now };
    };

    const onClick = () => {
      const now = Date.now();
      metricsRef.current.totalClicks += 1;
      metricsRef.current.lastInteractionAt = now;
      if (now - lastClickRef.current < 400) {
        metricsRef.current.rapidClicks += 1;
        metricsRef.current.doubleClicks += 1;
      }
      lastClickRef.current = now;
    };

    let lastScrollY = window.scrollY;
    let lastScrollT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScrollY);
      const dt = Math.max(1, now - lastScrollT);
      const v = (dy / dt) * 1000;
      metricsRef.current.scrollSpeed = v;
      metricsRef.current.totalScroll += dy;
      metricsRef.current.lastInteractionAt = Date.now();
      if (v > 1500) metricsRef.current.fastScrollEvents += 1;
      lastScrollY = window.scrollY;
      lastScrollT = now;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Hesitation/idle ticker
    const interval = window.setInterval(() => {
      const now = Date.now();
      const idle = now - metricsRef.current.lastInteractionAt;
      metricsRef.current.hesitationMs = idle;
      if (idle > 1500) metricsRef.current.totalIdleMs += 200;
    }, 200);
    idleTimerRef.current = interval;

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [phase]);

  // Observation engine — checks metrics periodically, fires reactions, escalates tension
  useEffect(() => {
    if (phase === "landing") return;
    const startedAt = Date.now();
    let phase1 = false,
      phase2 = false,
      phase3 = false,
      phase4 = false,
      phase5 = false;

    const tick = setInterval(() => {
      const m = metricsRef.current;
      const elapsed = Date.now() - startedAt;

      // Tension escalation by elapsed time + interaction
      let level = 0;
      if (elapsed > 8000) level = 1;
      if (elapsed > 22000) level = 2;
      if (elapsed > 40000) level = 3;
      if (elapsed > 65000) level = 4;
      if (elapsed > 95000) level = 5;
      if (m.rapidClicks > 4) level = Math.max(level, 3);
      if (m.circleScore > 50) level = Math.max(level, 3);

      setTensionLevel(level);
      setTension(level);

      // Phase 1 — subtle
      if (!phase1 && elapsed > 7000) {
        phase1 = true;
        if (m.hesitationMs > 1500) pushObservation("you paused there.", playEerie);
        else pushObservation("you arrived faster than most.", playWhisperHover);
      }

      // Live behavioral comments
      if (m.hesitationMs > 4000) pushObservation("thinking carefully?", playEerie);
      if (m.rapidClicks >= 4) pushObservation("impatience detected.", playTick);
      if (m.fastScrollEvents >= 3) pushObservation("you're skipping things.", playWhisperHover);
      if (m.circleScore > 30) pushObservation("you keep moving in circles.", playEerie);
      if (m.doubleClicks >= 2) pushObservation("you clicked that twice.", playTick);
      if (m.totalIdleMs > 8000) pushObservation("still there?", playEerie);

      // Phase 2
      if (!phase2 && elapsed > 25000) {
        phase2 = true;
        pushObservation("you read slower than most people.", playEerie);
      }

      // Phase 3 — predictions (timed)
      if (!phase3 && elapsed > 45000) {
        phase3 = true;
        pushObservation("you're going to scroll soon.", playReveal);
      }

      // Phase 4
      if (!phase4 && elapsed > 70000) {
        phase4 = true;
        pushObservation("you avoid uncomfortable sections.", playReveal);
      }

      // Phase 5
      if (!phase5 && elapsed > 100000) {
        phase5 = true;
        pushObservation("you keep searching for patterns.", playReveal);
      }
    }, 1500);

    return () => clearInterval(tick);
  }, [phase, pushObservation]);

  const handleEnter = () => {
    startAudio();
    setAudioOn(true);
    setPhase("intro");
    setTimeout(() => setPhase("exploring"), 3500);
  };

  const handleReveal = () => {
    playReveal();
    setPhase("reveal");
  };

  const tensionClass = `obs-tension-${tension}`;

  return (
    <div className={`relative min-h-screen ${tensionClass}`}>
      <div className="obs-vignette" />
      <div className="obs-grain" />
      {tension >= 2 && <div className="obs-scanlines" />}
      {tension >= 3 && <div className="obs-scan-sweep" />}
      {audioOn && <CursorGlow />}
      <ObservationLayer observations={observations} />

      {phase === "landing" && <Landing onEnter={handleEnter} returning={returning} />}
      {phase === "intro" && <Intro />}
      {phase === "exploring" && (
        <Exploring tension={tension} onReveal={handleReveal} pushObservation={pushObservation} />
      )}
      {phase === "reveal" && <Reveal metrics={metricsRef.current} />}

      <StatusBar tension={tension} phase={phase} />
    </div>
  );
}

/* ============ LANDING ============ */
function Landing({ onEnter, returning }: { onEnter: () => void; returning: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.5em] text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-[var(--observer-red)] obs-pulse" />
        <span>session.init</span>
      </div>

      <h1 className="obs-fade-in text-3xl md:text-5xl lg:text-6xl font-light tracking-[0.15em] uppercase max-w-3xl leading-tight">
        This website
        <br />
        <span className="text-[var(--observer-red)] obs-glitch">pays attention.</span>
      </h1>

      {returning && (
        <p className="mt-6 text-sm tracking-[0.3em] uppercase text-muted-foreground obs-fade-in">
          you came back.
        </p>
      )}

      {show && (
        <div className="mt-16 obs-fade-in">
          <button onClick={onEnter} className="obs-button">
            <span className="h-1.5 w-1.5 rounded-full bg-current obs-pulse" />
            Enter
          </button>
          <p className="mt-6 text-[0.65rem] tracking-[0.4em] uppercase text-muted-foreground/70">
            audio recommended
          </p>
        </div>
      )}
    </section>
  );
}

/* ============ INTRO ============ */
function Intro() {
  return (
    <section className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-sm md:text-lg tracking-[0.4em] uppercase text-foreground/80 obs-fade-in">
        observation.online
      </p>
    </section>
  );
}

/* ============ EXPLORING ============ */
function Exploring({
  tension,
  onReveal,
  pushObservation,
}: {
  tension: number;
  onReveal: () => void;
  pushObservation: (text: string, sound?: () => void) => void;
}) {
  const visitorNum =
    typeof window !== "undefined" ? localStorage.getItem(VISITOR_NUM_KEY) || "47" : "47";

  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-24 md:py-32">
      <header className="mb-20 text-center">
        <p className="text-[0.65rem] tracking-[0.5em] uppercase text-[var(--observer-red)] mb-6 obs-pulse">
          ◉ recording
        </p>
        <h2 className="text-2xl md:text-4xl font-light tracking-[0.1em] uppercase obs-text-watch">
          You are being observed.
        </h2>
        <p className="mt-6 text-sm tracking-[0.2em] uppercase text-muted-foreground">
          everything you do is a signal.
        </p>
      </header>

      <div className="space-y-12">
        <Card title="01 / motion">
          Your cursor draws a map of your hesitation. Every micro-pause is recorded as
          uncertainty.
        </Card>
        <Card title="02 / time">
          You have spent more time on this paragraph than the last one. Why?
        </Card>
        <HoverProbe pushObservation={pushObservation} />
        <Card title="03 / pattern">
          Most visitors scroll past this section without reading. You did not.
          <br />
          <span className="text-[var(--observer-red)]">Or did you?</span>
        </Card>
        <Card title={`04 / visitor.${visitorNum}`}>
          Visitor {visitorNum} stayed longer than you. They also clicked here three times.
        </Card>

        <div className="pt-8 text-center">
          <p className="mb-8 text-xs tracking-[0.3em] uppercase text-muted-foreground">
            when you are ready —
          </p>
          <button onClick={onReveal} className="obs-button">
            See what I learned about you
          </button>
        </div>
      </div>

      {tension >= 4 && (
        <div className="fixed bottom-6 right-6 text-[0.6rem] tracking-[0.3em] uppercase text-[var(--observer-red)]/70 obs-flicker">
          analysis: complete
        </div>
      )}
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="border border-border/60 bg-card/40 backdrop-blur-sm p-8 transition-all duration-700 hover:border-[var(--observer-red)]/60 hover:bg-card/60">
      <h3 className="mb-4 text-[0.65rem] tracking-[0.4em] uppercase text-[var(--observer-red)]/80">
        {title}
      </h3>
      <p className="text-base md:text-lg leading-relaxed text-foreground/85 obs-text-watch">
        {children}
      </p>
    </article>
  );
}

function HoverProbe({
  pushObservation,
}: {
  pushObservation: (text: string, sound?: () => void) => void;
}) {
  const [hoverStart, setHoverStart] = useState(0);
  return (
    <div
      onMouseEnter={() => setHoverStart(Date.now())}
      onMouseLeave={() => {
        const dur = Date.now() - hoverStart;
        if (dur > 2500) pushObservation("you stayed too long here.", playEerie);
      }}
      className="border border-dashed border-[var(--observer-red)]/40 p-8 text-center cursor-pointer transition-all hover:border-[var(--observer-red)]"
    >
      <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground">
        do not hover here.
      </p>
    </div>
  );
}

/* ============ REVEAL ============ */
function Reveal({ metrics }: { metrics: Metrics }) {
  const profile = useMemo(() => classifyProfile(metrics), [metrics]);
  const elapsed = Math.round((Date.now() - metrics.visitedAt) / 1000);

  const handleShare = async () => {
    const text = `A website psychoanalyzed my behavior. I am "${profile.type}". 😭`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: "You Are Being Observed", text, url });
      } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${url}`);
    }
  };

  return (
    <section className="relative z-10 mx-auto max-w-2xl px-6 py-24 md:py-32 text-center">
      <p className="text-[0.65rem] tracking-[0.5em] uppercase text-[var(--observer-red)] obs-pulse">
        ◉ profile.compiled
      </p>

      <h2 className="mt-10 text-3xl md:text-5xl font-light tracking-[0.1em] uppercase obs-fade-in">
        You are
      </h2>
      <h1 className="mt-4 text-4xl md:text-6xl font-light tracking-[0.1em] uppercase text-[var(--observer-red)] obs-glitch obs-heartbeat">
        {profile.type}
      </h1>

      <p className="mt-10 text-base md:text-lg leading-relaxed text-foreground/85">
        {profile.description}
      </p>

      <div className="mt-14 grid grid-cols-2 gap-px bg-border/60 border border-border/60 text-left">
        <Stat label="time observed" value={`${elapsed}s`} />
        <Stat label="cursor distance" value={`${Math.round(metrics.totalDistance)}px`} />
        <Stat label="hesitations" value={`${Math.round(metrics.totalIdleMs / 1000)}s`} />
        <Stat label="rapid clicks" value={`${metrics.rapidClicks}`} />
        <Stat label="circles drawn" value={`${Math.floor(metrics.circleScore / 10)}`} />
        <Stat label="skipped sections" value={`${metrics.fastScrollEvents}`} />
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={handleShare} className="obs-button">
          Share my profile
        </button>
        <button
          onClick={() => window.location.reload()}
          className="obs-button"
          style={{ borderColor: "oklch(0.4 0.01 20)" }}
        >
          Let someone else be observed
        </button>
      </div>

      <p className="mt-16 text-xs tracking-[0.3em] uppercase text-muted-foreground/70 max-w-md mx-auto leading-relaxed">
        the scariest thing isn't being watched.
        <br />
        <span className="text-[var(--observer-red)]/80">it's being understood.</span>
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/80 p-5">
      <p className="text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-light text-foreground">{value}</p>
    </div>
  );
}

/* ============ STATUS BAR ============ */
function StatusBar({ tension, phase }: { tension: number; phase: Phase }) {
  if (phase === "landing") return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-30 border-b border-border/40 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--observer-red)] obs-pulse" />
          <span>obs.session.live</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-4 ${i <= tension ? "bg-[var(--observer-red)]" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}