import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "You Are Not Alone" },
      { name: "description", content: "A live multiplayer experience. Or is it?" },
      { property: "og:title", content: "You Are Not Alone" },
      { property: "og:description", content: "Connect to live users in real time." },
    ],
  }),
  component: Index,
});

type Cursor = {
  id: number;
  name: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  hue: number;
  vx: number;
  vy: number;
  pauseUntil: number;
  follow: boolean;
  mimic: boolean;
  chase: boolean;
  clickAt: number;
};

type ChatMsg = { id: number; user: string; text: string; hue: number };
type Notice = { id: number; text: string };

const NAMES = [
  "user_482", "anon_7", "user_21", "anon_3", "guest_99", "user_x",
  "anon_88", "user_404", "ghost_12", "user_71", "anon_56", "user_03",
];
const CHAT_LINES = [
  "this is cool",
  "who else is here?",
  "is this real?",
  "anyone there?",
  "wait what",
  "lol",
  "hello?",
];
const EERIE_LINES = [
  "why are you here?",
  "he's still here",
  "don't move",
  "i can see your cursor",
  "you're still here...",
  "stop scrolling",
  "look up",
  "we know you",
];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function Index() {
  // 0 connecting, 1 normal, 2 subtle-follow, 3 eerie messages, 4 tension, 5 freeze+chase, 6 ended
  const [phase, setPhase] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [statusText, setStatusText] = useState("Connecting to live users...");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [endText, setEndText] = useState("");
  const [showWatching, setShowWatching] = useState(false);
  const [clickPulse, setClickPulse] = useState<{ id: number; x: number; y: number } | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [centerWhisper, setCenterWhisper] = useState("");

  const cursorsRef = useRef<Cursor[]>([]);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);

  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, moveLog: [] as { x: number; y: number; t: number }[] });
  const noticeId = useRef(0);
  const chatId = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Track real user pointer / touch
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.moveLog.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (mouseRef.current.moveLog.length > 60) mouseRef.current.moveLog.shift();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (t) {
        mouseRef.current.x = t.clientX;
        mouseRef.current.y = t.clientY;
      }
    });
    // init mouse to center
    mouseRef.current.x = window.innerWidth / 2;
    mouseRef.current.y = window.innerHeight / 2;
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Helper: spawn cursor
  const spawnCursor = useCallback((opts: Partial<Cursor> = {}) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const c: Cursor = {
      id: Math.random(),
      name: pick(NAMES) + (Math.random() < 0.3 ? Math.floor(Math.random() * 99) : ""),
      x: rand(50, w - 50),
      y: rand(80, h - 80),
      tx: rand(50, w - 50),
      ty: rand(80, h - 80),
      hue: Math.floor(rand(180, 320)),
      vx: 0,
      vy: 0,
      pauseUntil: 0,
      follow: false,
      mimic: false,
      chase: false,
      clickAt: 0,
      ...opts,
    };
    cursorsRef.current.push(c);
    return c;
  }, []);

  const removeCursor = useCallback(() => {
    if (cursorsRef.current.length > 1) cursorsRef.current.shift();
  }, []);

  const addNotice = useCallback((text: string) => {
    const id = ++noticeId.current;
    setNotices((n) => [...n, { id, text }]);
    setTimeout(() => setNotices((n) => n.filter((x) => x.id !== id)), 3500);
  }, []);

  const addChat = useCallback((user: string, text: string, hue: number) => {
    const id = ++chatId.current;
    setChat((c) => [...c.slice(-7), { id, user, text, hue }]);
  }, []);

  // Phase 0 -> 1 connecting sequence
  useEffect(() => {
    const t1 = setTimeout(() => {
      const initial = Math.floor(rand(5, 9));
      setUserCount(initial);
      setStatusText(`${initial} users online`);
      for (let i = 0; i < initial; i++) spawnCursor();
      setPhase(1);
    }, 1800);
    return () => clearTimeout(t1);
  }, [spawnCursor]);

  // Phase progression
  useEffect(() => {
    if (phase === 0 || phase >= 5) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (phase === 1) {
      // Phase 1: normal — then introduce subtle follower
      timers.push(setTimeout(() => {
        const c = cursorsRef.current[0];
        if (c) c.follow = true;
        setPhase(2);
      }, 10000));
    } else if (phase === 2) {
      // Phase 2: subtle follow — escalate with eerie messages
      timers.push(setTimeout(() => {
        addChat("system", "someone is watching...", 25);
        setPhase(3);
      }, 9000));
    } else if (phase === 3) {
      // Phase 3: eerie messages, plus a mimic
      timers.push(setTimeout(() => {
        const c = cursorsRef.current.find((x) => !x.follow);
        if (c) c.mimic = true;
      }, 3500));
      timers.push(setTimeout(() => {
        setShowWatching(true);
        setTimeout(() => setShowWatching(false), 3500);
      }, 6500));
      timers.push(setTimeout(() => setPhase(4), 11000));
    } else if (phase === 4) {
      // Phase 4: tension — more cursors lean toward user
      timers.push(setTimeout(() => {
        const targets = cursorsRef.current.slice(0, 3);
        targets.forEach((c) => (c.follow = true));
        addChat("system", "they're getting closer", 25);
      }, 1500));
      // wow moment: freeze, pause, then aggressive chase
      timers.push(setTimeout(() => setPhase(5), 9000));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, addChat]);

  // Phase 5: signature wow moment — freeze, pause, chase
  useEffect(() => {
    if (phase !== 5) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setFrozen(true);
    setCenterWhisper("");
    timers.push(setTimeout(() => {
      // pick the closest cursor and make it chase aggressively
      const m = mouseRef.current;
      let nearest: Cursor | null = null;
      let best = Infinity;
      for (const c of cursorsRef.current) {
        const d = Math.hypot(c.x - m.x, c.y - m.y);
        if (d < best) { best = d; nearest = c; }
      }
      cursorsRef.current.forEach((c) => { c.follow = false; c.mimic = false; c.chase = false; });
      if (nearest) nearest.chase = true;
      setFrozen(false);
    }, 1600));
    timers.push(setTimeout(() => setPhase(6), 5200));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Final phase
  useEffect(() => {
    if (phase !== 6) return;
    setFadeOut(true);
    setStatusText("");
    const t1 = setTimeout(() => {
      cursorsRef.current = [];
      setChat([]);
      setNotices([]);
      setUserCount(0);
      rerender();
    }, 1200);
    const t2 = setTimeout(() => setEndText("You were never alone."), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, rerender]);

  // User count fluctuation + join/leave notices
  useEffect(() => {
    if (phase === 0 || phase >= 5) return;
    const interval = setInterval(() => {
      const join = Math.random() < 0.55;
      setUserCount((n) => {
        let next = n;
        if (join && n < 14) {
          next = n + 1;
          spawnCursor();
          addNotice(`+1 ${pick(NAMES)} joined`);
        } else if (!join && n > 4) {
          next = n - 1;
          removeCursor();
          addNotice("someone left");
        }
        setStatusText(`${next} users online`);
        return next;
      });
    }, phase === 1 ? 3200 : phase === 2 ? 2400 : phase === 3 ? 1800 : 1400);
    return () => clearInterval(interval);
  }, [phase, spawnCursor, removeCursor, addNotice]);

  // Random fake interactions
  useEffect(() => {
    if (phase === 0 || phase >= 5) return;
    const interval = setInterval(() => {
      const c = pick(cursorsRef.current);
      if (!c) return;
      const action = Math.random();
      if (action < 0.35) {
        c.clickAt = performance.now();
        setClickPulse({ id: Math.random(), x: c.x, y: c.y });
        addNotice(`${c.name} clicked something`);
      } else if (action < 0.6) {
        addNotice(`${c.name} is exploring...`);
      } else {
        addChat(c.name, pick(CHAT_LINES), c.hue);
      }
    }, phase === 1 ? 3000 : phase === 2 ? 2200 : phase === 3 ? 1600 : 1200);
    return () => clearInterval(interval);
  }, [phase, addNotice, addChat]);

  // Eerie targeted messages (phase 3+)
  useEffect(() => {
    if (phase < 3 || phase >= 5) return;
    const interval = setInterval(() => {
      const c = pick(cursorsRef.current);
      addChat(c?.name ?? "anon_?", pick(EERIE_LINES), 25);
    }, phase === 3 ? 4500 : 2800);
    return () => clearInterval(interval);
  }, [phase, addChat]);

  // Animation loop
  const frozenRef = useRef(false);
  useEffect(() => { frozenRef.current = frozen; }, [frozen]);
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mouse = mouseRef.current;
      const isFrozen = frozenRef.current;

      for (const c of cursorsRef.current) {
        if (isFrozen) {
          c.vx *= 0.6;
          c.vy *= 0.6;
          c.x += c.vx * (dt / 16.6);
          c.y += c.vy * (dt / 16.6);
          continue;
        }

        // pick new target occasionally
        if (now > c.pauseUntil) {
          const dx = c.tx - c.x;
          const dy = c.ty - c.y;
          if (Math.hypot(dx, dy) < 8 || Math.random() < 0.005) {
            c.tx = rand(40, w - 40);
            c.ty = rand(60, h - 60);
            if (Math.random() < 0.3) c.pauseUntil = now + rand(400, 1500);
          }
        }

        let targetX = c.tx;
        let targetY = c.ty;

        if (c.chase) {
          targetX = mouse.x;
          targetY = mouse.y;
        } else if (c.follow) {
          targetX = mouse.x + Math.sin(now / 600) * 40;
          targetY = mouse.y + Math.cos(now / 800) * 40;
        } else if (c.mimic) {
          const delayed = mouse.moveLog[Math.max(0, mouse.moveLog.length - 30)];
          if (delayed) {
            targetX = delayed.x + 60;
            targetY = delayed.y + 20;
          }
        }

        // smooth easing toward target
        const ease = c.chase ? 0.18 : c.follow ? 0.06 : c.mimic ? 0.08 : 0.025;
        const desiredVx = (targetX - c.x) * ease;
        const desiredVy = (targetY - c.y) * ease;
        c.vx += (desiredVx - c.vx) * (c.chase ? 0.3 : 0.15);
        c.vy += (desiredVy - c.vy) * (c.chase ? 0.3 : 0.15);

        if (now < c.pauseUntil) {
          c.vx *= 0.85;
          c.vy *= 0.85;
        }

        c.x += c.vx * (dt / 16.6);
        c.y += c.vy * (dt / 16.6);
      }

      rerender();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [rerender]);

  // Click pulse cleanup
  useEffect(() => {
    if (!clickPulse) return;
    const t = setTimeout(() => setClickPulse(null), 700);
    return () => clearTimeout(t);
  }, [clickPulse]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground select-none">
      {/* ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, oklch(0.22 0.08 280 / 0.6), transparent 50%), radial-gradient(circle at 80% 70%, oklch(0.20 0.10 200 / 0.5), transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Header status */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2 text-sm">
          <span className={`relative inline-flex h-2 w-2 rounded-full ${phase >= 6 ? "bg-destructive" : "bg-emerald-400"}`}>
            {phase < 6 && (
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
            )}
          </span>
          <span className="font-mono tracking-wide text-foreground/80">
            {statusText || (phase >= 6 ? "disconnected" : "")}
          </span>
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
          live · session
        </div>
      </header>

      {/* Center hero */}
      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center justify-center px-6 pt-20 pb-40 text-center sm:pt-32">
        {phase === 0 && (
          <>
            <div className="mb-6 h-2 w-40 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-emerald-400 to-cyan-400" />
            </div>
            <p className="font-mono text-sm text-foreground/60">establishing presence...</p>
          </>
        )}

        {phase > 0 && phase < 6 && (
          <>
            <h1 className="bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-5xl font-light tracking-tight text-transparent sm:text-7xl">
              you are not alone
            </h1>
            <p className="mt-6 max-w-md font-mono text-sm text-foreground/50">
              {phase === 1 && "others are exploring with you in real time."}
              {phase === 2 && "more people are arriving every second."}
              {phase === 3 && "they can see your cursor."}
              {phase === 4 && "they're moving toward you."}
              {phase === 5 && (frozen ? "..." : "")}
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button
                className="group relative overflow-hidden rounded-full border border-foreground/15 bg-foreground/5 px-6 py-3 font-mono text-sm text-foreground/80 backdrop-blur transition hover:border-foreground/40 hover:bg-foreground/10"
                onClick={() => addChat("you", "hello?", 200)}
              >
                <span className="relative z-10">say hello</span>
                <span className="absolute inset-0 translate-y-full bg-gradient-to-t from-cyan-500/30 to-transparent transition-transform duration-500 group-hover:translate-y-0" />
              </button>
              <button
                className="rounded-full border border-foreground/15 bg-foreground/5 px-6 py-3 font-mono text-sm text-foreground/80 backdrop-blur transition hover:border-foreground/40 hover:bg-foreground/10"
                onClick={() => addNotice("you clicked something")}
              >
                make a sound
              </button>
            </div>
          </>
        )}

        {phase === 6 && endText && (
          <h1 className="fixed inset-0 z-50 flex items-center justify-center px-6 text-center text-4xl font-light tracking-wide text-foreground/95 sm:text-6xl" style={{ animation: "endingIn 3s ease-out both", textShadow: "0 0 40px oklch(0.7 0.05 260 / 0.6)" }}>
            {endText}
          </h1>
        )}
      </main>

      {/* Watching banner */}
      {showWatching && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-30 flex justify-center">
          <div className="rounded-md border border-destructive/40 bg-background/80 px-5 py-3 font-mono text-sm text-destructive backdrop-blur-md shadow-[0_0_40px_oklch(0.6_0.2_25_/_0.4)]">
            someone is watching you...
          </div>
        </div>
      )}

      {/* Notices feed */}
      <div className="pointer-events-none fixed left-4 top-20 z-20 flex w-64 flex-col gap-2 sm:left-8">
        {notices.slice(-5).map((n) => (
          <div
            key={n.id}
            className="rounded-md border border-foreground/10 bg-background/60 px-3 py-2 font-mono text-xs text-foreground/70 backdrop-blur-md"
            style={{ animation: "noticeIn 0.4s ease-out" }}
          >
            {n.text}
          </div>
        ))}
      </div>

      {/* Chat box */}
      {phase > 0 && phase < 6 && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-20 w-72 sm:bottom-8 sm:right-8">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs text-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            chat
          </div>
          <div className="flex flex-col gap-1.5 rounded-lg border border-foreground/10 bg-background/60 p-3 backdrop-blur-md">
            {chat.length === 0 && (
              <div className="font-mono text-xs text-foreground/30">no messages yet...</div>
            )}
            {chat.map((m) => (
              <div
                key={m.id}
                className="font-mono text-xs"
                style={{ animation: "noticeIn 0.4s ease-out" }}
              >
                <span style={{ color: `oklch(0.75 0.15 ${m.hue})` }}>{m.user}</span>
                <span className="text-foreground/70">: {m.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click pulse */}
      {clickPulse && (
        <div
          className="pointer-events-none fixed z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/60"
          style={{
            left: clickPulse.x,
            top: clickPulse.y,
            animation: "pulseRing 0.7s ease-out forwards",
          }}
        />
      )}

      {/* Cursors */}
      <div className="pointer-events-none fixed inset-0 z-10">
        {cursorsRef.current.map((c) => (
          <div
            key={c.id}
            className="absolute will-change-transform"
            style={{
              transform: `translate3d(${c.x}px, ${c.y}px, 0)`,
              transition: "filter 0.3s",
              filter: c.chase
                ? "drop-shadow(0 0 14px oklch(0.65 0.28 25))"
                : c.follow ? "drop-shadow(0 0 8px oklch(0.6 0.25 25))" : "none",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              style={{
                filter: `drop-shadow(0 0 6px oklch(0.7 0.2 ${c.hue} / 0.8))`,
              }}
            >
              <path
                d="M5.5 3.2 L5.5 18.5 L9.5 14.5 L12.2 20.5 L14.5 19.5 L11.8 13.6 L17.5 13.2 Z"
                fill={`oklch(0.85 0.15 ${c.hue})`}
                stroke="oklch(0.15 0.02 270)"
                strokeWidth="1"
              />
            </svg>
            <div
              className="ml-4 mt-0 inline-block whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px]"
              style={{
                background: `oklch(0.25 0.1 ${c.hue} / 0.85)`,
                color: `oklch(0.95 0.05 ${c.hue})`,
              }}
            >
              {c.name}
            </div>
          </div>
        ))}
      </div>

      {/* Final fade-to-black overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-[2200ms] ease-out"
        style={{
          background: "radial-gradient(circle at 50% 50%, oklch(0.06 0.01 270) 0%, oklch(0.02 0 0) 80%)",
          opacity: fadeOut ? 1 : 0,
        }}
      />

      <style>{`
        @keyframes noticeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0.9; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
        @keyframes endingIn {
          0% { opacity: 0; letter-spacing: 0.6em; filter: blur(8px); }
          60% { opacity: 0.7; filter: blur(2px); }
          100% { opacity: 1; letter-spacing: 0.05em; filter: blur(0); }
        }
      `}</style>
    </div>
  );
}
