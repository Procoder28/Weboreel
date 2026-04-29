import { useEffect, useRef } from "react";
import type { Phase } from "@/lib/themes";

interface Props {
  phase: Phase;
  color: string;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  twinkle: number;
}

export function Particles({ phase, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<P[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Build particles based on phase
    const count = phase === "night" ? 110 : phase === "morning" ? 55 : 45;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: phase === "night" ? (Math.random() - 0.5) * 0.05 : (Math.random() - 0.5) * 0.15,
      vy: phase === "night" ? (Math.random() - 0.5) * 0.05 : -0.05 - Math.random() * 0.15,
      r: phase === "night" ? Math.random() * 1.4 + 0.3 : Math.random() * 2 + 0.6,
      a: Math.random() * 0.6 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const alpha = phase === "night"
          ? p.a * (0.5 + Math.sin(p.twinkle) * 0.5)
          : p.a * (0.6 + Math.sin(p.twinkle) * 0.2);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(/\/\s*[\d.]+\)/, `/ ${alpha.toFixed(2)})`);
        // Fallback if regex didn't match (color without alpha)
        if (!ctx.fillStyle || ctx.fillStyle === "") ctx.fillStyle = color;
        ctx.shadowBlur = phase === "night" ? 6 : 4;
        ctx.shadowColor = color;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, color]);

  return <canvas ref={canvasRef} className="particles" />;
}
