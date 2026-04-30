import { useEffect, useMemo, useState } from "react";
import { FLOATING_WORDS } from "@/lib/generators";

export function FloatingBuzzwords({ count = 14 }: { count?: number }) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeed((s) => s + 1), 12000);
    return () => clearInterval(t);
  }, []);

  const words = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      word: FLOATING_WORDS[(i + seed) % FLOATING_WORDS.length],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 0.85 + Math.random() * 1.6,
      delay: Math.random() * 6,
      duration: 8 + Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.18,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, count]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {words.map((w, i) => (
        <span
          key={i}
          className="absolute font-display font-bold text-neon select-none"
          style={{
            left: `${w.left}%`,
            top: `${w.top}%`,
            fontSize: `${w.size}rem`,
            opacity: w.opacity,
            animation: `float ${w.duration}s ease-in-out ${w.delay}s infinite`,
            color: "var(--neon)",
          }}
        >
          {w.word}
        </span>
      ))}
    </div>
  );
}
