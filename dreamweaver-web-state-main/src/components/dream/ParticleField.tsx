import { useEffect, useRef } from "react";
import type { DreamPhase } from "@/hooks/useIdleDream";

interface Props {
  phase: DreamPhase;
  world: "ocean" | "cosmic" | "liminal";
}

/**
 * Canvas particle field. Density and palette shift with dream state + world.
 */
export function ParticleField({ phase, world }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth * window.devicePixelRatio);
    let h = (canvas.height = window.innerHeight * window.devicePixelRatio);
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const palettes = {
      awake: ["rgba(180,200,255,", "rgba(160,180,240,"],
      ocean: ["rgba(120,200,230,", "rgba(80,160,210,", "rgba(200,240,255,"],
      cosmic: ["rgba(200,160,255,", "rgba(255,180,220,", "rgba(140,180,255,"],
      liminal: ["rgba(240,220,180,", "rgba(220,200,170,", "rgba(255,240,210,"],
    };

    const count = phase === "awake" ? 60 : 140;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);

      const pal = phase === "awake" ? palettes.awake : palettes[world];
      const drift = phase === "dreaming" ? 1.6 : phase === "drifting" ? 1.0 : 0.4;

      particles.forEach((p, i) => {
        // gentle wandering
        p.x += p.vx * drift + Math.sin(t + p.phase) * 0.3 * drift;
        p.y += p.vy * drift + Math.cos(t * 0.8 + p.phase) * 0.3 * drift;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        const flicker = 0.5 + 0.5 * Math.sin(t * 2 + p.phase);
        const color = pal[i % pal.length];
        const alpha = p.a * (phase === "awake" ? 0.6 : 1) * (0.5 + flicker * 0.5);

        ctx.beginPath();
        const radius = p.r * window.devicePixelRatio * (phase === "dreaming" ? 1.6 : 1);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 6);
        grad.addColorStop(0, color + alpha + ")");
        grad.addColorStop(1, color + "0)");
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, radius * 6, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = canvas.width = window.innerWidth * window.devicePixelRatio;
      h = canvas.height = window.innerHeight * window.devicePixelRatio;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [phase, world]);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" aria-hidden />;
}
