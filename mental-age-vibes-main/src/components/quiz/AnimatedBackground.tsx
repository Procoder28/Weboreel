import { useEffect, useState } from "react";

interface Props {
  themeClass?: string;
  glitch?: boolean;
}

/**
 * Decorative animated blob background. Sits behind everything else.
 */
export function AnimatedBackground({ themeClass, glitch }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${themeClass ?? ""}`}
    >
      <div className="absolute inset-0 opacity-90">
        <div
          className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full blur-3xl animate-blob"
          style={{ background: "oklch(0.78 0.2 305 / 0.55)" }}
        />
        <div
          className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full blur-3xl animate-blob"
          style={{
            background: "oklch(0.78 0.18 240 / 0.5)",
            animationDelay: "-6s",
          }}
        />
        <div
          className="absolute -bottom-32 left-1/4 h-[30rem] w-[30rem] rounded-full blur-3xl animate-blob"
          style={{
            background: "oklch(0.82 0.18 350 / 0.5)",
            animationDelay: "-12s",
          }}
        />
      </div>

      {mounted && (
        <div className="absolute inset-0">
          {Array.from({ length: 14 }).map((_, i) => {
            const left = (i * 73) % 100;
            const delay = (i * 0.7) % 6;
            const dur = 6 + (i % 5);
            const size = 6 + (i % 4) * 4;
            return (
              <span
                key={i}
                className="absolute rounded-full bg-white/40 animate-float"
                style={{
                  left: `${left}%`,
                  bottom: `-${20 + (i % 5) * 10}px`,
                  width: size,
                  height: size,
                  animationDelay: `-${delay}s`,
                  animationDuration: `${dur}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {glitch && (
        <div className="absolute inset-0 mix-blend-overlay opacity-30 animate-glitch bg-[radial-gradient(circle_at_30%_20%,oklch(0.7_0.3_25/0.6),transparent_60%)]" />
      )}
    </div>
  );
}