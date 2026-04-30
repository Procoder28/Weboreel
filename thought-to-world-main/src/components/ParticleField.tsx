import { useEffect, useRef } from "react";
import type { World } from "@/lib/thoughtEngine";

interface Props {
  world: World;
  intensity?: number; // 0..1
  glitch?: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; life: number; maxLife: number; hue: number;
}

const WORLD_CONFIG: Record<World, { count: number; speed: number; size: [number, number]; trail: number; mode: "drift" | "rain" | "rise" | "swirl" | "glitch" }> = {
  cosmic:    { count: 180, speed: 0.15, size: [0.5, 2.2], trail: 0.06, mode: "drift" },
  nostalgia: { count: 120, speed: 0.25, size: [1.0, 3.0], trail: 0.05, mode: "rise" },
  melancholy:{ count: 220, speed: 0.9,  size: [0.5, 1.4], trail: 0.10, mode: "rain" },
  peace:     { count: 100, speed: 0.18, size: [1.0, 2.5], trail: 0.04, mode: "swirl" },
  hope:      { count: 160, speed: 0.3,  size: [0.6, 2.5], trail: 0.05, mode: "rise" },
  chaos:     { count: 260, speed: 1.2,  size: [0.4, 2.0], trail: 0.18, mode: "glitch" },
};

export function ParticleField({ world, intensity = 0.5, glitch = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove);

    const cfg = WORLD_CONFIG[world];
    const count = Math.floor(cfg.count * (0.7 + intensity * 0.6));

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    const spawn = (i: number): Particle => {
      const size = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]);
      const hueRanges: Record<World, [number, number]> = {
        cosmic: [240, 320],
        nostalgia: [20, 50],
        melancholy: [200, 240],
        peace: [120, 170],
        hope: [40, 200],
        chaos: [300, 360],
      };
      const [h1, h2] = hueRanges[world];
      const hue = h1 + Math.random() * (h2 - h1);
      let x = Math.random() * w();
      let y = Math.random() * h();
      let vx = 0, vy = 0;
      if (cfg.mode === "rain") { y = -Math.random() * h(); vy = cfg.speed * (2 + Math.random() * 3); vx = (Math.random() - 0.5) * 0.3; }
      else if (cfg.mode === "rise") { y = h() + Math.random() * h(); vy = -cfg.speed * (1 + Math.random() * 2); vx = (Math.random() - 0.5) * 0.4; }
      else if (cfg.mode === "swirl") { vx = (Math.random() - 0.5) * cfg.speed; vy = (Math.random() - 0.5) * cfg.speed; }
      else if (cfg.mode === "glitch") { vx = (Math.random() - 0.5) * cfg.speed * 4; vy = (Math.random() - 0.5) * cfg.speed * 4; }
      else { vx = (Math.random() - 0.5) * cfg.speed; vy = (Math.random() - 0.5) * cfg.speed; }
      return { x, y, vx, vy, r: size, life: Math.random() * 200, maxLife: 300 + Math.random() * 400, hue };
    };

    particles = Array.from({ length: count }, (_, i) => spawn(i));

    const tick = () => {
      ctx.fillStyle = `rgba(0,0,0,${cfg.trail})`;
      ctx.fillRect(0, 0, w(), h());

      const mx = mouseRef.current.x, my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Cursor influence — ripple/repel
        const dx = p.x - mx, dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 18000) {
          const f = (1 - d2 / 18000) * 0.6;
          p.vx += (dx / Math.sqrt(d2 + 1)) * f;
          p.vy += (dy / Math.sqrt(d2 + 1)) * f;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;
        if (cfg.mode === "rain") p.vy += 0.03;
        if (cfg.mode === "rise") p.vy -= 0.005;
        p.life++;

        if (
          p.life > p.maxLife ||
          p.x < -50 || p.x > w() + 50 ||
          p.y < -50 || p.y > h() + 50
        ) {
          particles[i] = spawn(i);
          continue;
        }

        const alpha = Math.min(1, Math.min(p.life / 30, (p.maxLife - p.life) / 60)) * 0.85;
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 75%, ${alpha})`);
        grad.addColorStop(1, `hsla(${p.hue}, 90%, 60%, 0)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (glitch || cfg.mode === "glitch") {
        if (Math.random() < 0.05) {
          ctx.fillStyle = `hsla(${Math.random() * 360}, 90%, 60%, 0.06)`;
          const y = Math.random() * h();
          ctx.fillRect(0, y, w(), 2 + Math.random() * 6);
        }
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [world, intensity, glitch]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
