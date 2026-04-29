import { useEffect, useRef, useState, useCallback } from "react";

type Particle = {
  x: number; y: number; vx: number; vy: number; life: number; max: number; hue: number; size: number;
};
type Orb = {
  x: number; y: number; vx: number; vy: number; r: number; hue: number; trail: { x: number; y: number }[];
};

const MESSAGES = [
  "You control gravity",
  "The world responds to you",
  "Tilt to bend reality",
  "Shake to break it all",
];

export default function SensorWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    orbs: [] as Orb[],
    particles: [] as Particle[],
    gx: 0, // gravity x (-1..1)
    gy: 0.4,
    targetGx: 0,
    targetGy: 0.4,
    shakeIntensity: 0,
    flash: 0,
    w: 0,
    h: 0,
    dpr: 1,
    lastShake: 0,
    lastAccel: { x: 0, y: 0, z: 0 },
    bgPhase: 0,
  });

  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [permState, setPermState] = useState<"idle" | "needed" | "granted" | "denied" | "unsupported">("idle");
  const [showIntro, setShowIntro] = useState(true);
  const [message, setMessage] = useState(MESSAGES[0]);
  const [shakeCount, setShakeCount] = useState(0);

  // theme apply
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // listen system theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);

  // init scene
  const initOrbs = useCallback((w: number, h: number) => {
    const count = Math.min(14, Math.max(8, Math.floor((w * h) / 90000)));
    const orbs: Orb[] = [];
    for (let i = 0; i < count; i++) {
      orbs.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r: 14 + Math.random() * 28,
        hue: Math.random() * 360,
        trail: [],
      });
    }
    stateRef.current.orbs = orbs;
  }, []);

  // resize
  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      stateRef.current.w = w;
      stateRef.current.h = h;
      stateRef.current.dpr = dpr;
      if (stateRef.current.orbs.length === 0) initOrbs(w, h);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [initOrbs]);

  const triggerShake = useCallback(() => {
    const s = stateRef.current;
    s.shakeIntensity = 30;
    s.flash = 1;
    // explode orbs outward
    for (const o of s.orbs) {
      const a = Math.random() * Math.PI * 2;
      const force = 18 + Math.random() * 14;
      o.vx += Math.cos(a) * force;
      o.vy += Math.sin(a) * force;
    }
    // particle burst
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 10;
      s.particles.push({
        x: s.w / 2,
        y: s.h / 2,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        max: 40 + Math.random() * 30,
        hue: Math.random() * 360,
        size: 2 + Math.random() * 3,
      });
    }
    setShakeCount((c) => c + 1);
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    // haptic
    if ("vibrate" in navigator) navigator.vibrate?.(60);
  }, []);

  // sensors
  const enableSensors = useCallback(async () => {
    setShowIntro(false);
    const DOE = (window as any).DeviceOrientationEvent;
    const DME = (window as any).DeviceMotionEvent;
    try {
      if (DOE && typeof DOE.requestPermission === "function") {
        const r = await DOE.requestPermission();
        if (r !== "granted") {
          setPermState("denied");
          return;
        }
      }
      if (DME && typeof DME.requestPermission === "function") {
        await DME.requestPermission().catch(() => {});
      }
      setPermState("granted");
    } catch {
      setPermState("denied");
    }
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const DOE = (window as any).DeviceOrientationEvent;
    if (isMobile && DOE && typeof DOE.requestPermission === "function") {
      setPermState("needed");
    } else if (!isMobile) {
      setPermState("unsupported");
    } else {
      setPermState("granted");
    }

    const onOrient = (e: DeviceOrientationEvent) => {
      // gamma: left-right [-90,90], beta: front-back [-180,180]
      const g = (e.gamma ?? 0) / 45;
      const b = ((e.beta ?? 0) - 30) / 45;
      s.targetGx = Math.max(-1.2, Math.min(1.2, g));
      s.targetGy = Math.max(-1.2, Math.min(1.2, b));
    };

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const x = a.x ?? 0, y = a.y ?? 0, z = a.z ?? 0;
      const dx = x - s.lastAccel.x;
      const dy = y - s.lastAccel.y;
      const dz = z - s.lastAccel.z;
      const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
      s.lastAccel = { x, y, z };
      const now = performance.now();
      if (delta > 25 && now - s.lastShake > 700) {
        s.lastShake = now;
        triggerShake();
      }
    };

    // Mouse fallback for desktop
    const onMouse = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      s.targetGx = nx * 1.1;
      s.targetGy = ny * 1.1;
    };
    const onClick = () => {
      // desktop "shake" via double-click handled separately
    };
    const onDbl = () => triggerShake();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") triggerShake();
      if (e.key.toLowerCase() === "t") setTheme((t) => (t === "dark" ? "light" : "dark"));
    };

    window.addEventListener("deviceorientation", onOrient);
    window.addEventListener("devicemotion", onMotion);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("click", onClick);
    window.addEventListener("dblclick", onDbl);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("click", onClick);
      window.removeEventListener("dblclick", onDbl);
      window.removeEventListener("keydown", onKey);
    };
  }, [triggerShake]);

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const loop = () => {
      const s = stateRef.current;
      const { w, h, dpr } = s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // smooth gravity
      s.gx += (s.targetGx - s.gx) * 0.12;
      s.gy += (s.targetGy - s.gy) * 0.12;

      // screen shake offset
      let sx = 0, sy = 0;
      if (s.shakeIntensity > 0.1) {
        sx = (Math.random() - 0.5) * s.shakeIntensity;
        sy = (Math.random() - 0.5) * s.shakeIntensity;
        s.shakeIntensity *= 0.88;
      }

      ctx.save();
      ctx.translate(sx, sy);

      // background gradient
      const isDark = document.documentElement.classList.contains("dark");
      s.bgPhase += 0.003;
      const grad = ctx.createRadialGradient(
        w / 2 + s.gx * 80,
        h / 2 + s.gy * 80,
        50,
        w / 2,
        h / 2,
        Math.max(w, h)
      );
      if (isDark) {
        grad.addColorStop(0, `hsl(${260 + Math.sin(s.bgPhase) * 30}, 70%, 18%)`);
        grad.addColorStop(0.6, "hsl(250, 60%, 8%)");
        grad.addColorStop(1, "hsl(240, 70%, 4%)");
      } else {
        grad.addColorStop(0, `hsl(${40 + Math.sin(s.bgPhase) * 20}, 90%, 88%)`);
        grad.addColorStop(0.6, "hsl(200, 70%, 82%)");
        grad.addColorStop(1, "hsl(220, 60%, 75%)");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(-50, -50, w + 100, h + 100);

      // parallax stars / dust
      ctx.globalAlpha = isDark ? 0.8 : 0.4;
      for (let i = 0; i < 60; i++) {
        const px = ((i * 197 + s.bgPhase * 200 - s.gx * 30) % w + w) % w;
        const py = ((i * 131 + Math.sin(s.bgPhase + i) * 20 - s.gy * 30) % h + h) % h;
        const r = (i % 3) + 0.5;
        ctx.fillStyle = isDark ? `hsla(${(i * 37) % 360}, 90%, 75%, 0.6)` : `hsla(${(i * 37) % 360}, 70%, 60%, 0.3)`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // physics for orbs
      const gAccel = 0.55;
      for (const o of s.orbs) {
        o.vx += s.gx * gAccel;
        o.vy += s.gy * gAccel;
        o.vx *= 0.992;
        o.vy *= 0.992;
        o.x += o.vx;
        o.y += o.vy;

        // collisions with edges
        if (o.x - o.r < 0) { o.x = o.r; o.vx = -o.vx * 0.7; }
        if (o.x + o.r > w) { o.x = w - o.r; o.vx = -o.vx * 0.7; }
        if (o.y - o.r < 0) { o.y = o.r; o.vy = -o.vy * 0.7; }
        if (o.y + o.r > h) { o.y = h - o.r; o.vy = -o.vy * 0.7; }

        // trail
        o.trail.push({ x: o.x, y: o.y });
        if (o.trail.length > 12) o.trail.shift();
      }

      // orb-orb collisions (simple)
      for (let i = 0; i < s.orbs.length; i++) {
        for (let j = i + 1; j < s.orbs.length; j++) {
          const a = s.orbs[i], b = s.orbs[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = a.r + b.r;
          if (d < min && d > 0) {
            const nx = dx / d, ny = dy / d;
            const overlap = (min - d) / 2;
            a.x -= nx * overlap; a.y -= ny * overlap;
            b.x += nx * overlap; b.y += ny * overlap;
            const va = a.vx * nx + a.vy * ny;
            const vb = b.vx * nx + b.vy * ny;
            const diff = vb - va;
            a.vx += diff * nx * 0.9; a.vy += diff * ny * 0.9;
            b.vx -= diff * nx * 0.9; b.vy -= diff * ny * 0.9;
          }
        }
      }

      // draw orbs with glow
      ctx.globalCompositeOperation = "lighter";
      for (const o of s.orbs) {
        // trail
        for (let i = 0; i < o.trail.length; i++) {
          const t = o.trail[i];
          const a = (i / o.trail.length) * 0.35;
          ctx.fillStyle = `hsla(${o.hue}, 90%, 65%, ${a})`;
          ctx.beginPath();
          ctx.arc(t.x, t.y, o.r * (i / o.trail.length) * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
        // glow
        const og = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2.5);
        og.addColorStop(0, `hsla(${o.hue}, 95%, 70%, 1)`);
        og.addColorStop(0.4, `hsla(${o.hue}, 95%, 60%, 0.55)`);
        og.addColorStop(1, `hsla(${o.hue}, 95%, 60%, 0)`);
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 2.5, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.fillStyle = `hsl(${o.hue}, 100%, 85%)`;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // particles
      const alive: Particle[] = [];
      for (const p of s.particles) {
        p.vx += s.gx * 0.2;
        p.vy += s.gy * 0.2 + 0.05;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const a = 1 - p.life / p.max;
        if (a > 0) {
          ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          alive.push(p);
        }
      }
      s.particles = alive;
      ctx.globalCompositeOperation = "source-over";

      // flash overlay
      if (s.flash > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.5})`;
        ctx.fillRect(0, 0, w, h);
        s.flash *= 0.85;
      }

      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // rotate message occasionally
  useEffect(() => {
    const id = setInterval(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden touch-none select-none" style={{ color: "var(--sw-text)" }}>
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 pointer-events-none">
        <div className="text-xs uppercase tracking-[0.3em] opacity-70 sw-fade-up">
          Sensor · World
        </div>
        <button
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="pointer-events-auto text-xs uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border backdrop-blur-md transition hover:scale-105"
          style={{ borderColor: "currentColor", background: "color-mix(in oklab, currentColor 8%, transparent)" }}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "◐ Night" : "☀ Day"}
        </button>
      </div>

      {/* Bottom message */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center pointer-events-none">
        <div
          key={message + shakeCount}
          className="sw-fade-up text-center px-6"
        >
          <div className="text-2xl md:text-4xl font-light tracking-tight" style={{ textShadow: "0 0 30px currentColor" }}>
            {message}
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.4em] opacity-60">
            {permState === "unsupported" ? "Move your mouse · Double-click to shake" : "Tilt to control · Shake to break"}
          </div>
        </div>
      </div>

      {/* Intro overlay */}
      {showIntro && (
        <div
          className="absolute inset-0 flex items-center justify-center backdrop-blur-xl"
          style={{ background: "color-mix(in oklab, var(--sw-bg-end) 60%, transparent)" }}
        >
          <div className="max-w-md mx-auto px-8 text-center sw-fade-up">
            <div className="text-[10px] uppercase tracking-[0.5em] opacity-70 mb-4">An interactive experiment</div>
            <h1 className="text-5xl md:text-6xl font-light leading-tight mb-6" style={{ textShadow: "0 0 40px currentColor" }}>
              Sensor<br/>World
            </h1>
            <p className="text-base opacity-80 mb-2">Tilt your phone to control the world.</p>
            <p className="text-base opacity-80 mb-8">Shake to break it.</p>
            <button
              onClick={enableSensors}
              className="px-8 py-3 rounded-full text-sm uppercase tracking-[0.3em] border-2 transition-all hover:scale-105 active:scale-95"
              style={{
                borderColor: "currentColor",
                background: "color-mix(in oklab, currentColor 15%, transparent)",
                boxShadow: "0 0 40px color-mix(in oklab, currentColor 40%, transparent)",
              }}
            >
              {permState === "needed" ? "Enable Motion" : "Enter"}
            </button>
            {permState === "unsupported" && (
              <p className="mt-6 text-xs opacity-60">
                Desktop detected — use mouse to tilt, double-click or press space to shake.
              </p>
            )}
            {permState === "denied" && (
              <p className="mt-6 text-xs opacity-60">
                Motion access denied. You can still explore with touch.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
