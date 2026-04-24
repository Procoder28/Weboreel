import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "intro" | "playing" | "won";

interface FloatMsg {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface FakeBtn {
  id: number;
  x: number;
  y: number;
  label: string;
}

const TAUNTS = [
  "Too slow 😏",
  "Nice try!",
  "You almost had it!",
  "Not today 🙃",
  "lol nope",
  "Get faster!",
  "Try again 👀",
  "So close!",
];

const FAKE_LABELS = ["Click me!", "Win!", "Real one →", "← Real one", "Press here", "Winner!"];

// Web Audio sound effects (no assets)
function playBoop(type: "miss" | "glitch" | "win") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    if (type === "miss") {
      o.type = "sine";
      o.frequency.setValueAtTime(440, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.15);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start();
      o.stop(ctx.currentTime + 0.16);
    } else if (type === "glitch") {
      o.type = "square";
      o.frequency.setValueAtTime(120, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.08);
      o.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.16);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.start();
      o.stop(ctx.currentTime + 0.18);
    } else {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const oo = ctx.createOscillator();
        const gg = ctx.createGain();
        oo.connect(gg);
        gg.connect(ctx.destination);
        oo.type = "triangle";
        oo.frequency.value = freq;
        gg.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gg.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.02);
        gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
        oo.start(ctx.currentTime + i * 0.1);
        oo.stop(ctx.currentTime + i * 0.1 + 0.3);
      });
    }
  } catch {}
}

const LEVEL_NAMES = [
  "Warm-up",
  "Twitchy",
  "Decoys",
  "Shrinking",
  "Chaos",
  "FINAL BOSS",
];

export default function BeatTheWebsite() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState(1); // 1..6
  const [pos, setPos] = useState({ x: 50, y: 50 }); // percent
  const [size, setSize] = useState(1);
  const [hidden, setHidden] = useState(false);
  const [shake, setShake] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [fakes, setFakes] = useState<FakeBtn[]>([]);
  const [msgs, setMsgs] = useState<FloatMsg[]>([]);
  const [time, setTime] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);

  const arenaRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const startedAt = useRef<number>(0);
  const msgId = useRef(0);
  const lastJump = useRef(0);

  useEffect(() => {
    const b = localStorage.getItem("btw-best");
    if (b) setBest(parseFloat(b));
  }, []);

  // timer
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setTime((Date.now() - startedAt.current) / 1000), 50);
    return () => clearInterval(id);
  }, [phase]);

  const addMsg = useCallback((text: string, x: number, y: number) => {
    const id = ++msgId.current;
    setMsgs((m) => [...m, { id, text, x, y }]);
    setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 1400);
  }, []);

  const randomPos = useCallback(() => {
    const m = 12;
    return { x: m + Math.random() * (100 - m * 2), y: m + Math.random() * (100 - m * 2) };
  }, []);

  const spawnFakes = useCallback(
    (n: number) => {
      const arr: FakeBtn[] = [];
      for (let i = 0; i < n; i++) {
        const p = randomPos();
        arr.push({ id: i, x: p.x, y: p.y, label: FAKE_LABELS[i % FAKE_LABELS.length] });
      }
      setFakes(arr);
    },
    [randomPos]
  );

  const startGame = () => {
    setPhase("playing");
    setLevel(1);
    setPos({ x: 50, y: 50 });
    setSize(1);
    setFakes([]);
    setMisses(0);
    setTime(0);
    startedAt.current = Date.now();
  };

  // dodge logic - reacts to mouse/touch proximity
  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (phase !== "playing") return;
      const btn = btnRef.current;
      const arena = arenaRef.current;
      if (!btn || !arena) return;
      const r = btn.getBoundingClientRect();
      const ar = arena.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      const triggerDist =
        level === 1 ? 80 : level === 2 ? 130 : level === 3 ? 110 : level === 4 ? 120 : 160;

      if (dist < triggerDist) {
        const now = performance.now();
        if (now - lastJump.current < (level >= 5 ? 60 : 120)) return;
        lastJump.current = now;

        if (level >= 2) {
          // jump random
          setPos(randomPos());
        } else {
          // slight push away
          const arenaW = ar.width;
          const arenaH = ar.height;
          const pushX = (-dx / dist) * 60;
          const pushY = (-dy / dist) * 60;
          setPos((p) => {
            const nx = Math.max(8, Math.min(92, p.x + (pushX / arenaW) * 100));
            const ny = Math.max(8, Math.min(92, p.y + (pushY / arenaH) * 100));
            return { x: nx, y: ny };
          });
        }

        if (level >= 4) setSize(0.55 + Math.random() * 0.5);
        if (level >= 5 && Math.random() < 0.25) {
          setHidden(true);
          setTimeout(() => setHidden(false), 250);
        }
        if (level >= 6 && Math.random() < 0.2) {
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      }
    },
    [phase, level, randomPos]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [handlePointer]);

  // refresh fakes per level
  useEffect(() => {
    if (phase !== "playing") return;
    if (level >= 3) spawnFakes(level === 3 ? 4 : level === 4 ? 5 : level === 5 ? 7 : 9);
    else setFakes([]);
    if (level >= 6) {
      setGlitch(true);
    } else setGlitch(false);
  }, [level, phase, spawnFakes]);

  const handleRealClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (phase !== "playing") return;
    if (level < 6) {
      // advance level
      playBoop("glitch");
      const next = level + 1;
      setLevel(next);
      setPos(randomPos());
      setSize(1);
      addMsg(`Level ${next}: ${LEVEL_NAMES[next - 1]}`, 50, 30);
    } else {
      // win
      const final = (Date.now() - startedAt.current) / 1000;
      setTime(final);
      playBoop("win");
      setPhase("won");
      if (best === null || final < best) {
        localStorage.setItem("btw-best", String(final));
        setBest(final);
      }
    }
  };

  const handleFakeClick = (e: React.MouseEvent | React.TouchEvent, fx: number, fy: number) => {
    e.stopPropagation();
    playBoop("miss");
    setMisses((m) => m + 1);
    addMsg(TAUNTS[Math.floor(Math.random() * TAUNTS.length)], fx, fy);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    // shuffle fakes
    spawnFakes(fakes.length);
    setPos(randomPos());
  };

  const handleArenaMiss = (e: React.MouseEvent) => {
    if (phase !== "playing") return;
    const ar = arenaRef.current?.getBoundingClientRect();
    if (!ar) return;
    playBoop("miss");
    setMisses((m) => m + 1);
    addMsg(TAUNTS[Math.floor(Math.random() * TAUNTS.length)], ((e.clientX - ar.left) / ar.width) * 100, ((e.clientY - ar.top) / ar.height) * 100);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden bg-chaos scanlines ${shake ? "shake" : ""}`}>
      {/* HUD */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <h1 className={`text-xl font-black tracking-tight md:text-2xl ${glitch ? "glitch" : ""}`}>
          CAN YOU BEAT <span style={{ color: "var(--neon-cyan)" }}>THE WEBSITE?</span>
        </h1>
        {phase === "playing" && (
          <div className="flex items-center gap-3 font-mono text-sm md:text-base">
            <span className="rounded-md border border-white/10 bg-black/30 px-3 py-1">
              LVL <span style={{ color: "var(--neon-yellow)" }}>{level}</span>/6
            </span>
            <span className="rounded-md border border-white/10 bg-black/30 px-3 py-1">
              ⏱ {time.toFixed(2)}s
            </span>
            <span className="rounded-md border border-white/10 bg-black/30 px-3 py-1">
              ✗ {misses}
            </span>
          </div>
        )}
      </header>

      {/* Intro */}
      {phase === "intro" && (
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-2 text-sm uppercase tracking-[0.3em]" style={{ color: "var(--neon-cyan)" }}>
            A Game That Fights Back
          </p>
          <h2 className="mb-6 text-4xl font-black leading-tight md:text-7xl">
            Click. The. <span style={{ color: "var(--neon-pink)" }}>Button.</span>
          </h2>
          <p className="mb-10 max-w-xl text-base text-white/70 md:text-lg">
            Six levels. One button. The website will dodge, lie, glitch, and gaslight you. Good luck.
          </p>
          <button
            onClick={startGame}
            className="btn-target pulse-glow rounded-full px-10 py-5 text-lg md:text-xl"
          >
            Start the Fight →
          </button>
          {best !== null && (
            <p className="mt-8 font-mono text-sm text-white/60">
              Best time: <span style={{ color: "var(--neon-yellow)" }}>{best.toFixed(2)}s</span>
            </p>
          )}
        </div>
      )}

      {/* Arena */}
      {phase === "playing" && (
        <div
          ref={arenaRef}
          onClick={handleArenaMiss}
          className="relative mx-4 mb-6 h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm md:mx-8 md:h-[75vh]"
        >
          <p className="absolute left-1/2 top-4 z-10 -translate-x-1/2 text-center font-mono text-xs uppercase tracking-widest text-white/40 md:text-sm">
            Goal: click the real button →
          </p>

          {/* Fakes */}
          {fakes.map((f) => (
            <button
              key={f.id}
              onClick={(e) => handleFakeClick(e, f.x, f.y)}
              onTouchStart={(e) => handleFakeClick(e, f.x, f.y)}
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
              className="btn-fake absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-5 py-3 text-sm font-bold md:px-7 md:py-4 md:text-base"
            >
              {f.label}
            </button>
          ))}

          {/* Real button */}
          {!hidden && (
            <button
              ref={btnRef}
              onClick={handleRealClick}
              onTouchStart={(e) => {
                // on mobile, tap-near = jump
                const t = e.touches[0];
                const r = btnRef.current?.getBoundingClientRect();
                if (r) {
                  const cx = r.left + r.width / 2;
                  const cy = r.top + r.height / 2;
                  const d = Math.hypot(t.clientX - cx, t.clientY - cy);
                  if (d > Math.max(r.width, r.height) / 2) {
                    setPos(randomPos());
                  }
                }
              }}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) scale(${size})`,
              }}
              className="btn-target pulse-glow absolute rounded-full px-8 py-4 text-base md:px-10 md:py-5 md:text-lg"
            >
              {level >= 6 ? "FINAL CLICK" : "Click me!"}
            </button>
          )}

          {/* Floating taunts */}
          {msgs.map((m) => (
            <div
              key={m.id}
              className="float-msg pointer-events-none absolute z-20 font-black"
              style={{
                left: `${m.x}%`,
                top: `${m.y}%`,
                color: "var(--neon-yellow)",
                textShadow: "0 0 10px oklch(0.72 0.28 350)",
                fontSize: "clamp(1rem, 3vw, 1.75rem)",
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
      )}

      {/* Win */}
      {phase === "won" && (
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16 text-center">
          <Confetti />
          <h2 className="mb-4 text-5xl font-black md:text-7xl">
            You beat <span style={{ color: "var(--neon-pink)" }}>the website!</span> 🎉
          </h2>
          <p className="mb-2 text-lg text-white/80">
            Time: <span className="font-mono" style={{ color: "var(--neon-yellow)" }}>{time.toFixed(2)}s</span> · Misses: {misses}
          </p>
          {best !== null && (
            <p className="mb-8 font-mono text-sm text-white/60">
              Best: <span style={{ color: "var(--neon-cyan)" }}>{best.toFixed(2)}s</span>
            </p>
          )}
          <button
            onClick={startGame}
            className="btn-target pulse-glow rounded-full px-10 py-5 text-lg"
          >
            Play Again ↻
          </button>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 80 });
  const colors = ["var(--neon-pink)", "var(--neon-cyan)", "var(--neon-yellow)", "var(--neon-green)"];
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-10vh",
              width: size,
              height: size * 1.6,
              background: color,
              animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
              borderRadius: "2px",
            }}
          />
        );
      })}
    </div>
  );
}
