import { useEffect, useRef } from "react";

type Mode = "stars" | "rain" | "embers" | "bubbles" | "cosmic" | "leaves";

interface Props {
  mode: Mode;
  density?: number;
}

export function ParticleField({ mode, density = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; hue?: number; life?: number };
    const count = Math.floor((mode === "stars" ? 220 : mode === "rain" ? 180 : 90) * density);
    const particles: P[] = [];

    const init = () => {
      for (let i = 0; i < count; i++) {
        if (mode === "rain") {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: -1, vy: 8 + Math.random() * 6, r: 1, a: 0.4 + Math.random() * 0.4 });
        } else if (mode === "stars") {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, r: Math.random() * 1.4, a: Math.random() });
        } else if (mode === "embers") {
          particles.push({ x: Math.random() * w, y: h + Math.random() * 200, vx: (Math.random() - 0.5) * 0.4, vy: -0.5 - Math.random() * 1.2, r: 1 + Math.random() * 1.5, a: Math.random(), hue: 20 + Math.random() * 30 });
        } else if (mode === "bubbles") {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 1.0, r: 2 + Math.random() * 5, a: 0.3 + Math.random() * 0.4 });
        } else if (mode === "cosmic") {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, r: Math.random() * 1.6, a: Math.random(), hue: 240 + Math.random() * 80 });
        } else if (mode === "leaves") {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: -0.5 - Math.random(), vy: 0.6 + Math.random() * 0.8, r: 2 + Math.random() * 3, a: 0.5 + Math.random() * 0.5, hue: 80 + Math.random() * 60 });
        }
      }
    };
    init();

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (mode === "rain") {
          if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
          ctx.strokeStyle = `rgba(180,220,255,${p.a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y - 12);
          ctx.stroke();
        } else if (mode === "stars") {
          p.a += (Math.random() - 0.5) * 0.05;
          p.a = Math.max(0.1, Math.min(1, p.a));
          ctx.fillStyle = `rgba(255,255,255,${p.a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (mode === "embers") {
          if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
          ctx.fillStyle = `hsla(${p.hue},90%,60%,${p.a})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsla(${p.hue},90%,60%,1)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (mode === "bubbles") {
          if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
          ctx.strokeStyle = `rgba(180,230,255,${p.a})`;
          ctx.fillStyle = `rgba(180,230,255,${p.a * 0.2})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (mode === "cosmic") {
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
          ctx.fillStyle = `hsla(${p.hue},80%,75%,${p.a})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `hsla(${p.hue},80%,75%,1)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (mode === "leaves") {
          if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w + 100; }
          if (p.x < -20) { p.x = w + 20; }
          ctx.fillStyle = `hsla(${p.hue},60%,50%,${p.a})`;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * 1.5, p.r * 0.6, p.x * 0.01, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [mode, density]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} />;
}
