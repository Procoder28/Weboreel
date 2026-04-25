import { useEffect, useRef, useState, useCallback } from "react";
import { playBoing, playPop, playMagic, unlockAudio } from "@/lib/sounds";

type Mode = "draw" | "loading" | "alive";
type Tool = "brush" | "eraser";

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

type ShapeKind = "circle" | "square" | "triangle" | "blob";

interface AliveObject {
  id: number;
  kind: ShapeKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  rotation: number;
  vr: number;
  walkDir: number;
  colorTimer: number;
  wigglePhase: number;
  flashTimer: number;
  speech?: { text: string; until: number };
}

const COLORS = [
  "#ff3df0", "#00f0ff", "#fff03d", "#a855ff", "#3dff8a", "#ff8a3d", "#ffffff",
];
const PHRASES = ["Hey!", "Why did you draw me?", "Boop!", "Wheee!", "Hi there!", "Tickles!", "✨", "Eep!"];

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function classifyStroke(points: { x: number; y: number }[]): { kind: ShapeKind; cx: number; cy: number; radius: number } {
  if (points.length < 2) {
    const p = points[0] ?? { x: 0, y: 0 };
    return { kind: "blob", cx: p.x, cy: p.y, radius: 30 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX, h = maxY - minY;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const radius = Math.max(20, Math.max(w, h) / 2);

  const start = points[0], end = points[points.length - 1];
  const closure = Math.hypot(end.x - start.x, end.y - start.y);
  const isClosed = closure < Math.max(w, h) * 0.35;

  if (!isClosed) return { kind: "blob", cx, cy, radius };

  const aspect = w / Math.max(1, h);
  let avg = 0;
  for (const p of points) avg += Math.hypot(p.x - cx, p.y - cy);
  avg /= points.length;
  let variance = 0;
  for (const p of points) {
    const d = Math.hypot(p.x - cx, p.y - cy) - avg;
    variance += d * d;
  }
  variance = Math.sqrt(variance / points.length) / avg;

  if (variance < 0.18 && aspect > 0.7 && aspect < 1.4) return { kind: "circle", cx, cy, radius };
  if (aspect > 0.75 && aspect < 1.3 && variance < 0.4) return { kind: "square", cx, cy, radius };
  return { kind: pick<ShapeKind>(["triangle", "square", "blob"]), cx, cy, radius };
}

export function DrawAlive() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>("draw");
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [size, setSize] = useState<number>(8);
  const [showHint, setShowHint] = useState(true);

  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const objectsRef = useRef<AliveObject[]>([]);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      sizeRef.current = { w, h };
      for (const c of [canvasRef.current, animCanvasRef.current]) {
        if (!c) continue;
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = w + "px";
        c.style.height = h + "px";
        const ctx = c.getContext("2d");
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      redrawAll();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const redrawAll = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);
    for (const s of strokesRef.current) drawStroke(ctx, s);
    if (currentStrokeRef.current) drawStroke(ctx, currentStrokeRef.current);
  }, []);

  function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
    if (s.points.length === 0) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      const p = s.points[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const getPos = (e: PointerEvent) => {
      const rect = c.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onDown = (e: PointerEvent) => {
      if (mode !== "draw") return;
      unlockAudio();
      setShowHint(false);
      drawingRef.current = true;
      c.setPointerCapture(e.pointerId);
      const p = getPos(e);
      const strokeColor = tool === "eraser" ? "rgba(0,0,0,1)" : color;
      currentStrokeRef.current = {
        points: [p],
        color: strokeColor,
        size: tool === "eraser" ? size * 2.5 : size,
      };
      redrawAll();
    };
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current || !currentStrokeRef.current) return;
      const p = getPos(e);
      const pts = currentStrokeRef.current.points;
      const last = pts[pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 1.2) return;
      pts.push(p);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const s = currentStrokeRef.current;
      ctx.save();
      if (tool === "eraser") ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.shadowColor = tool === "eraser" ? "transparent" : s.color;
      ctx.shadowBlur = tool === "eraser" ? 0 : 8;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
    };
    const onUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      if (currentStrokeRef.current) {
        if (tool !== "eraser") {
          strokesRef.current.push(currentStrokeRef.current);
        }
        currentStrokeRef.current = null;
      }
    };
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onUp);
    c.addEventListener("pointerleave", onUp);
    return () => {
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerup", onUp);
      c.removeEventListener("pointercancel", onUp);
      c.removeEventListener("pointerleave", onUp);
    };
  }, [mode, tool, color, size, redrawAll]);

  function clearCanvas() {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    redrawAll();
  }

  function bringToLife() {
    if (strokesRef.current.length === 0) return;
    unlockAudio();
    playMagic();
    setMode("loading");
    setTimeout(() => {
      const objs: AliveObject[] = [];
      let id = 0;
      for (const s of strokesRef.current) {
        const cls = classifyStroke(s.points);
        objs.push({
          id: id++,
          kind: cls.kind,
          x: cls.cx,
          y: cls.cy,
          vx: rand(-2, 2),
          vy: rand(-2, 0),
          radius: Math.min(120, Math.max(22, cls.radius)),
          color: s.color.startsWith("rgba") ? pick(COLORS) : s.color,
          rotation: 0,
          vr: rand(-0.05, 0.05),
          walkDir: Math.random() < 0.5 ? -1 : 1,
          colorTimer: rand(60, 180),
          wigglePhase: Math.random() * Math.PI * 2,
          flashTimer: 0,
        });
      }
      objectsRef.current = objs;
      setMode("alive");
    }, 1400);
  }

  useEffect(() => {
    if (mode !== "alive") return;
    const c = animCanvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;

    const G = 0.45;
    let last = performance.now();

    const loop = (t: number) => {
      const dt = Math.min(2, (t - last) / 16.67);
      last = t;
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      const objs = objectsRef.current;
      for (const o of objs) {
        if (o.kind === "circle" || o.kind === "blob" || o.kind === "triangle") {
          o.vy += G * dt;
          o.x += o.vx * dt;
          o.y += o.vy * dt;
        } else if (o.kind === "square") {
          o.vy += G * dt;
          o.x += o.walkDir * 1.6 * dt;
          o.y += o.vy * dt;
        }

        if (o.kind === "triangle") o.rotation += o.vr * dt * 4;
        if (o.kind === "blob") o.wigglePhase += 0.15 * dt;

        const r = o.radius;
        if (o.x - r < 0) { o.x = r; o.vx = Math.abs(o.vx) * 0.8; if (o.kind === "square") o.walkDir = 1; }
        if (o.x + r > w) { o.x = w - r; o.vx = -Math.abs(o.vx) * 0.8; if (o.kind === "square") o.walkDir = -1; }
        if (o.y + r > h) {
          o.y = h - r;
          if (Math.abs(o.vy) > 1.2) playBoing();
          o.vy = -Math.abs(o.vy) * 0.72;
          o.vx *= 0.96;
          if (o.kind === "triangle" && Math.random() < 0.4) o.vy -= rand(4, 7);
        }
        if (o.y - r < 0) { o.y = r; o.vy = Math.abs(o.vy) * 0.6; }

        if (o.kind === "square") {
          o.colorTimer -= dt;
          if (o.colorTimer <= 0) {
            o.color = pick(COLORS);
            o.colorTimer = rand(60, 180);
          }
        }

        if (o.flashTimer > 0) o.flashTimer -= dt;
      }

      for (let i = 0; i < objs.length; i++) {
        for (let j = i + 1; j < objs.length; j++) {
          const a = objs[i], b = objs[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = a.radius + b.radius;
          if (d > 0 && d < min) {
            const nx = dx / d, ny = dy / d;
            const overlap = (min - d) / 2;
            a.x -= nx * overlap; a.y -= ny * overlap;
            b.x += nx * overlap; b.y += ny * overlap;
            const avx = a.vx, avy = a.vy;
            a.vx = b.vx * 0.9; a.vy = b.vy * 0.9;
            b.vx = avx * 0.9; b.vy = avy * 0.9;
          }
        }
      }

      for (const o of objs) drawObject(ctx, o, t);

      ctx.font = "600 16px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      for (const o of objs) {
        if (o.speech && t < o.speech.until) {
          const alpha = Math.max(0, (o.speech.until - t) / 1500);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "rgba(20,10,40,0.85)";
          const text = o.speech.text;
          const tw = ctx.measureText(text).width + 18;
          const bx = o.x - tw / 2, by = o.y - o.radius - 38;
          ctx.beginPath();
          ctx.roundRect(bx, by, tw, 28, 14);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.fillText(text, o.x, by + 19);
          ctx.globalAlpha = 1;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [mode]);

  function drawObject(ctx: CanvasRenderingContext2D, o: AliveObject, t: number) {
    ctx.save();
    ctx.translate(o.x, o.y);
    const flash = o.flashTimer > 0 ? 1 + Math.sin(o.flashTimer) * 0.15 : 1;
    ctx.scale(flash, flash);
    ctx.shadowColor = o.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = o.color;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;

    if (o.kind === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawEyes(ctx, o.radius, "happy");
    } else if (o.kind === "square") {
      const s = o.radius * 1.6;
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s / 2, s, s, 8);
      ctx.fill();
      ctx.stroke();
      drawEyes(ctx, o.radius * 0.8, "walk", o.walkDir);
    } else if (o.kind === "triangle") {
      ctx.rotate(o.rotation);
      const r = o.radius;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.95, r * 0.85);
      ctx.lineTo(-r * 0.95, r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawEyes(ctx, r * 0.6, "wow");
    } else {
      const r = o.radius;
      ctx.beginPath();
      const sides = 14;
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const wob = 1 + Math.sin(o.wigglePhase + i * 1.3) * 0.12;
        const x = Math.cos(a) * r * wob;
        const y = Math.sin(a) * r * wob;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawEyes(ctx, r * 0.7, "silly");
    }
    ctx.restore();
  }

  function drawEyes(ctx: CanvasRenderingContext2D, r: number, mood: "happy" | "walk" | "wow" | "silly", dir = 1) {
    ctx.shadowBlur = 0;
    const eyeOffX = r * 0.38;
    const eyeY = -r * 0.15;
    const eyeR = Math.max(3, r * 0.13);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-eyeOffX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOffX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0a0a14";
    const pupilR = eyeR * 0.55;
    const pdx = mood === "walk" ? dir * eyeR * 0.35 : 0;
    const pdy = mood === "wow" ? -eyeR * 0.2 : 0;
    ctx.beginPath(); ctx.arc(-eyeOffX + pdx, eyeY + pdy, pupilR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOffX + pdx, eyeY + pdy, pupilR, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "#0a0a14";
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    if (mood === "happy") {
      ctx.arc(0, r * 0.18, r * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
    } else if (mood === "wow") {
      ctx.arc(0, r * 0.28, r * 0.16, 0, Math.PI * 2);
    } else if (mood === "silly") {
      ctx.moveTo(-r * 0.3, r * 0.25);
      ctx.quadraticCurveTo(0, r * 0.5, r * 0.3, r * 0.25);
    } else {
      ctx.moveTo(-r * 0.25, r * 0.28);
      ctx.lineTo(r * 0.25, r * 0.28);
    }
    ctx.stroke();
  }

  useEffect(() => {
    if (mode !== "alive") return;
    const c = animCanvasRef.current; if (!c) return;
    const onTap = (e: PointerEvent) => {
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const objs = objectsRef.current;
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (Math.hypot(x - o.x, y - o.y) < o.radius + 6) {
          o.vy = -10 - Math.random() * 4;
          o.vx += rand(-2, 2);
          o.color = pick(COLORS);
          o.flashTimer = 12;
          o.speech = { text: pick(PHRASES), until: performance.now() + 1500 };
          playPop();
          return;
        }
      }
    };
    c.addEventListener("pointerdown", onTap);
    return () => c.removeEventListener("pointerdown", onTap);
  }, [mode]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 no-touch"
        style={{ display: mode === "alive" ? "none" : "block", cursor: mode === "draw" ? "crosshair" : "default" }}
      />
      <canvas
        ref={animCanvasRef}
        className="absolute inset-0 no-touch"
        style={{ display: mode === "alive" ? "block" : "none", cursor: "pointer" }}
      />

      <div className="pointer-events-none absolute top-0 left-0 right-0 flex justify-center pt-3 sm:pt-5">
        <h1 className="panel rounded-full px-4 py-1.5 sm:px-5 sm:py-2 text-sm sm:text-base font-bold tracking-wide text-neon" style={{ color: "var(--neon-cyan)" }}>
          ✨ Draw → Comes Alive
        </h1>
      </div>

      {showHint && mode === "draw" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <div className="panel rounded-3xl px-6 py-5 max-w-md animate-pulse-glow">
            <p className="text-xl sm:text-2xl font-bold text-neon" style={{ color: "var(--neon-pink)" }}>
              Draw anything
            </p>
            <p className="mt-1 text-sm sm:text-base opacity-80">and bring it to life ✨</p>
          </div>
        </div>
      )}

      {mode === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-background/40">
          <div className="panel rounded-3xl px-8 py-7 text-center animate-pulse-glow">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-transparent animate-spin-slow"
              style={{ borderTopColor: "var(--neon-pink)", borderRightColor: "var(--neon-cyan)" }} />
            <p className="text-lg font-bold text-neon" style={{ color: "var(--neon-yellow)" }}>
              Analyzing your drawing…
            </p>
            <p className="mt-1 text-xs opacity-70">summoning AI magic</p>
          </div>
        </div>
      )}

      {mode === "draw" && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-3 sm:pb-5 px-3">
          <div className="panel rounded-2xl px-3 py-2.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-full">
            <ToolBtn active={tool === "brush"} onClick={() => setTool("brush")} label="Brush">🖌️</ToolBtn>
            <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")} label="Eraser">🧽</ToolBtn>

            <div className="flex items-center gap-1 px-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool("brush"); }}
                  aria-label={`color ${c}`}
                  className="w-7 h-7 sm:w-7 sm:h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c,
                    borderColor: color === c && tool === "brush" ? "#fff" : "transparent",
                    boxShadow: color === c && tool === "brush" ? `0 0 10px ${c}` : "none",
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 px-1 min-w-[110px]">
              <span className="text-xs opacity-70 hidden sm:inline">Size</span>
              <input
                type="range" min={2} max={40} value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-20 sm:w-24 accent-[var(--neon-pink)]"
              />
              <span className="text-xs w-5 text-right tabular-nums">{size}</span>
            </div>

            <button
              onClick={clearCanvas}
              className="h-11 min-w-11 px-3 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition"
            >
              Clear
            </button>

            <button
              onClick={bringToLife}
              className="h-12 px-4 sm:px-5 rounded-2xl text-sm sm:text-base font-extrabold tracking-wide active:scale-95 transition animate-pulse-glow text-primary-foreground"
              style={{ background: "linear-gradient(135deg, var(--neon-pink), var(--neon-purple))" }}
            >
              Bring to Life 🚀
            </button>
          </div>
        </div>
      )}

      {mode === "alive" && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 sm:pb-6 px-3">
          <div className="panel rounded-2xl px-3 py-2.5 flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => { setMode("draw"); objectsRef.current = []; }}
              className="h-11 px-4 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition"
            >
              ← Keep drawing
            </button>
            <button
              onClick={() => { strokesRef.current = []; objectsRef.current = []; redrawAll(); setMode("draw"); setShowHint(true); }}
              className="h-11 px-4 rounded-xl text-sm font-semibold text-primary-foreground active:scale-95 transition"
              style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-green))" }}
            >
              New canvas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ children, active, onClick, label }: { children: React.ReactNode; active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="h-11 w-11 rounded-xl text-lg flex items-center justify-center active:scale-95 transition"
      style={{
        background: active ? "linear-gradient(135deg, var(--neon-pink), var(--neon-purple))" : "rgba(255,255,255,0.08)",
        boxShadow: active ? "0 0 16px oklch(0.72 0.28 330 / 0.6)" : "none",
      }}
    >
      {children}
    </button>
  );
}
