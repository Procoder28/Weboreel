import { useEffect, useRef } from "react";

/**
 * Animated starfield canvas — pure CSS would not give the depth feel.
 * Lightweight: ~120 stars, drifting slowly with subtle twinkle.
 */
export function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.8 + 0.2,
      vy: Math.random() * 0.05 + 0.01,
      tw: Math.random() * 0.02 + 0.005,
      tp: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += s.vy;
        s.tp += s.tw;
        if (s.y > h) s.y = 0;
        const alpha = s.a * (0.6 + 0.4 * Math.sin(s.tp));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 255, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}