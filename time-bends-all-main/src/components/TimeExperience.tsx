import { useEffect, useMemo, useRef, useState } from "react";

type Phase = 1 | 2 | 3 | 4 | 5;

const MESSAGES: Record<Phase, string[]> = {
  1: ["Stay here…", "and watch."],
  2: ["Do you feel it?", "Something is different…", "The air has shifted.", "Time is moving."],
  3: ["The walls are breathing.", "Was it always like this?", "Something is wrong.", "Don't look away."],
  4: ["EVERYTHING IS CHANGING", "STAY", "WITNESS", "T̷I̷M̷E̷", "L̸O̸O̸K̸", "R̴̛U̷N̷", "N̸O̸W̸"],
  5: ["", "Time changes everything.", "Even you.", "You stayed.", "You witnessed it."],
};

// Shock blackout window between chaos and resolution
const SHOCK_START = 90;
const SHOCK_END = 93;

function getPhase(t: number): Phase {
  if (t < 10) return 1;
  if (t < 30) return 2;
  if (t < 60) return 3;
  if (t < SHOCK_START) return 4;
  return 5;
}

interface Shard {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
}

export default function TimeExperience() {
  const [elapsed, setElapsed] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<number>(performance.now());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<{ osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode } | null>(null);

  const phase = getPhase(elapsed);

  // Shards (decorative floating elements)
  const shards = useMemo<Shard[]>(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 40 + Math.random() * 180,
      hue: Math.random() * 360,
    }));
  }, []);

  // Animation loop
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000;
      setElapsed(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cycle messages — slower in phase 5 for emotional weight
  useEffect(() => {
    const interval =
      phase === 1 ? 4500 :
      phase === 2 ? 3500 :
      phase === 3 ? 2000 :
      phase === 4 ? 600 :
      3800;
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setMsgIdx((i) => i + 1);
        setFading(false);
      }, phase === 5 ? 1400 : 600);
    }, interval);
    return () => clearInterval(id);
  }, [phase]);

  // Reset message index when phase changes
  useEffect(() => {
    setMsgIdx(0);
  }, [phase]);

  // Glitch bursts — much more aggressive in phase 4
  useEffect(() => {
    if (phase < 3) return;
    const id = setInterval(
      () => {
        setGlitch(true);
        const el = contentRef.current;
        if (el) {
          const mag = phase >= 4 ? 28 : 12;
          el.style.setProperty("--gx", `${(Math.random() - 0.5) * mag}px`);
          el.style.setProperty("--gy", `${(Math.random() - 0.5) * (mag * 0.7)}px`);
        }
        setTimeout(() => setGlitch(false), phase >= 4 ? 320 : 120);
      },
      phase === 3 ? 1400 : 200,
    );
    return () => clearInterval(id);
  }, [phase]);

  // SHOCK transition: full-screen burst right at phase 4 → 5
  const [shock, setShock] = useState(false);
  useEffect(() => {
    if (elapsed >= SHOCK_START && elapsed < SHOCK_END) {
      if (!shock) setShock(true);
    } else if (shock) {
      setShock(false);
    }
  }, [elapsed, shock]);

  // Subtle ticking sound — gets louder/faster as time progresses, silent in finale
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (phase === 5) return;
    const tickInterval = phase === 1 ? 1000 : phase === 2 ? 800 : phase === 3 ? 500 : 180;
    const tickGain = phase === 1 ? 0.015 : phase === 2 ? 0.025 : phase === 3 ? 0.04 : 0.06;
    const id = setInterval(() => {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = phase >= 4 ? 1800 : 1200;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(tickGain, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      o.connect(g).connect(ctx.destination);
      o.start(now);
      o.stop(now + 0.06);
    }, tickInterval);
    return () => clearInterval(id);
  }, [phase, elapsed > 0]);

  // Mouse / touch parallax
  useEffect(() => {
    const handle = (x: number, y: number) => {
      const el = stageRef.current;
      if (!el) return;
      const mx = (x / window.innerWidth) * 100;
      const my = (y / window.innerHeight) * 100;
      el.style.setProperty("--mx", `${mx}%`);
      el.style.setProperty("--my", `${my}%`);
    };
    const onMove = (e: MouseEvent) => handle(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handle(t.clientX, t.clientY);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  // Audio: ambient drone evolving with phase
  useEffect(() => {
    const start = () => {
      if (audioCtxRef.current) return;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 110;
      gain.gain.value = 0.0;
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain).connect(osc.frequency);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      lfo.start();
      oscRef.current = { osc, gain, lfo };
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
    };
    const opts = { once: true } as AddEventListenerOptions;
    window.addEventListener("pointerdown", start, opts);
    window.addEventListener("keydown", start, opts);
    window.addEventListener("touchstart", start, opts);
    return () => {
      window.removeEventListener("pointerdown", start, opts);
      window.removeEventListener("keydown", start, opts);
      window.removeEventListener("touchstart", start, opts);
    };
  }, []);

  // Update audio per phase — phase 4 is harsher; shock = sudden silence
  useEffect(() => {
    const ref = oscRef.current;
    const ctx = audioCtxRef.current;
    if (!ref || !ctx) return;
    const now = ctx.currentTime;
    const cfg = {
      1: { freq: 110, gain: 0.04, type: "sine" as OscillatorType, lfo: 0.2 },
      2: { freq: 138, gain: 0.06, type: "sine" as OscillatorType, lfo: 0.6 },
      3: { freq: 92,  gain: 0.09, type: "triangle" as OscillatorType, lfo: 1.4 },
      4: { freq: 55,  gain: 0.22, type: "sawtooth" as OscillatorType, lfo: 9 },
      5: { freq: 220, gain: 0.035, type: "sine" as OscillatorType, lfo: 0.12 },
    }[phase];
    ref.osc.type = cfg.type;
    ref.osc.frequency.cancelScheduledValues(now);
    ref.osc.frequency.linearRampToValueAtTime(cfg.freq, now + (phase === 5 ? 3.5 : 1.2));
    ref.gain.gain.cancelScheduledValues(now);
    if (phase === 5) {
      // sudden silence, then slow emotional swell
      ref.gain.gain.linearRampToValueAtTime(0, now + 0.05);
      ref.gain.gain.linearRampToValueAtTime(cfg.gain, now + 4);
    } else {
      ref.gain.gain.linearRampToValueAtTime(cfg.gain, now + 1.2);
    }
    if (ref.lfo) ref.lfo.frequency.linearRampToValueAtTime(cfg.lfo, now + 1.5);
  }, [phase]);

  // Visibility-aware "early leave" detection (shown only if user comes back)
  const [leftEarly, setLeftEarly] = useState(false);
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && elapsed < 60) setLeftEarly(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [elapsed]);

  const messages = MESSAGES[phase];
  const currentMsg = phase === 5
    ? messages[Math.min(msgIdx, messages.length - 1)]
    : messages[msgIdx % messages.length];

  // Dynamic transforms for content based on phase
  const contentStyle: React.CSSProperties = useMemo(() => {
    if (phase <= 1) return {};
    if (phase === 2) {
      const drift = Math.sin(elapsed * 0.6) * 6;
      return { transform: `translate(${drift}px, ${Math.cos(elapsed * 0.4) * 4}px)` };
    }
    if (phase === 3) {
      const drift = Math.sin(elapsed * 1.2) * 18;
      return {
        transform: `translate(${drift}px, ${Math.cos(elapsed * 0.9) * 12}px) skew(${Math.sin(elapsed) * 2}deg)`,
        letterSpacing: `${0.02 + Math.sin(elapsed) * 0.02}em`,
      };
    }
    if (phase === 4) {
      const jx = (Math.random() - 0.5) * 14;
      const jy = (Math.random() - 0.5) * 10;
      return {
        filter: `hue-rotate(${(elapsed * 140) % 360}deg) contrast(1.7) saturate(2) blur(${Math.abs(Math.sin(elapsed * 6)) * 1.5}px)`,
        letterSpacing: `${0.05 + Math.sin(elapsed * 6) * 0.18}em`,
        transform: `translate(${jx}px, ${jy}px) scale(${1 + Math.sin(elapsed * 8) * 0.04})`,
      };
    }
    return { transition: "all 2.4s cubic-bezier(0.22, 1, 0.36, 1)" };
  }, [phase, elapsed]);

  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  const progress = Math.min(elapsed / SHOCK_START, 1);
  const inFinalReveal = phase === 5 && elapsed > SHOCK_END + 1.5;

  return (
    <div
      ref={stageRef}
      className={`tce-stage phase-${phase} ${phase === 4 ? "shake hard-shake" : ""}`}
    >
      <div className={`tce-bg ${phase >= 2 && phase < 5 ? "drift" : ""}`} />

      {/* Floating shards */}
      {phase < 5 && shards.map((s) => {
        const wob = phase >= 3 ? Math.sin(elapsed * 0.5 + s.id) * 30 : Math.sin(elapsed * 0.2 + s.id) * 8;
        return (
          <div
            key={s.id}
            className="tce-shard"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: `oklch(0.85 0.15 ${(s.hue + elapsed * (phase * 8)) % 360})`,
              transform: `translate(${wob}px, ${wob * -0.6}px)`,
              opacity: phase === 4 ? 0.85 : 0.35,
              mixBlendMode: phase >= 3 ? "screen" : "normal",
              filter: phase === 4 ? `blur(${2 + Math.abs(Math.sin(elapsed * 4)) * 4}px)` : undefined,
            }}
          />
        );
      })}

      <div className="tce-noise" />

      <div ref={contentRef} className="tce-content" style={contentStyle}>
        <h1
          className={`tce-title tce-glitch ${glitch ? "on" : ""} ${fading ? "fading" : ""} ${inFinalReveal ? "final-glow" : ""}`}
          data-text={currentMsg}
        >
          {currentMsg}
        </h1>
        {phase === 1 && (
          <p className="tce-sub fade-in-slow">an experience in time</p>
        )}
        {phase === 5 && inFinalReveal && msgIdx >= 2 && (
          <p className="tce-sub fade-in-slow" style={{ marginTop: "2.5rem", opacity: 0.5 }}>
            {leftEarly ? "you almost missed it" : `${Math.floor(elapsed)} seconds of your life`}
          </p>
        )}
      </div>

      {/* Subtle progress indicator — hairline at the bottom */}
      {phase < 5 && (
        <div className="tce-progress" style={{ transform: `scaleX(${progress})` }} />
      )}

      {/* Shock burst overlay */}
      <div className={`tce-shock ${shock ? "on" : ""}`} />

      <div className="tce-timer">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
    </div>
  );
}
