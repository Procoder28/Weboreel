import { ReactNode } from "react";

// Each universe is a fixed background scene; opacity is driven by parent.
// Content for each section sits separately in the scroll track.

export function CyberpunkScene({ scrollY }: { scrollY: number }) {
  const buildings = Array.from({ length: 14 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, oklch(0.1 0.1 320) 0%, oklch(0.18 0.2 340) 60%, oklch(0.08 0.05 280) 100%)" }} />
      {/* Distant skyline */}
      <div className="absolute inset-x-0 bottom-0 h-2/3" style={{ transform: `translateY(${scrollY * 0.05}px)` }}>
        {buildings.map((_, i) => {
          const left = (i / buildings.length) * 100;
          const height = 30 + ((i * 53) % 50);
          const hue = i % 2 ? 330 : 200;
          return (
            <div key={i} className="absolute bottom-0 animate-flicker" style={{
              left: `${left}%`,
              width: `${5 + (i % 3) * 2}%`,
              height: `${height}%`,
              background: `linear-gradient(180deg, oklch(0.15 0.05 280), oklch(0.05 0.02 280))`,
              boxShadow: `0 0 60px oklch(0.7 0.25 ${hue} / 0.3), inset 0 0 30px oklch(0 0 0 / 0.5)`,
              animationDelay: `${i * 0.3}s`,
            }}>
              {/* Windows */}
              {Array.from({ length: 8 }).map((_, w) => (
                <div key={w} className="absolute" style={{
                  left: "20%", right: "20%",
                  top: `${10 + w * 11}%`,
                  height: "3px",
                  background: `oklch(0.85 0.2 ${hue})`,
                  boxShadow: `0 0 8px oklch(0.85 0.2 ${hue})`,
                  opacity: (i * w) % 3 ? 1 : 0.2,
                }} />
              ))}
            </div>
          );
        })}
      </div>
      {/* Holographic ad */}
      <div className="absolute top-1/4 right-[10%] font-display neon-text text-3xl md:text-5xl animate-flicker" style={{ transform: `translateY(${-scrollY * 0.15}px)` }}>
        NEO·2099
      </div>
      <div className="absolute top-[40%] left-[8%] neon-cyan text-sm md:text-base font-mono" style={{ transform: `translateY(${-scrollY * 0.25}px)` }}>
        &gt; signal_lock: stable
      </div>
      {/* Scan line */}
      <div className="absolute inset-x-0 h-32 pointer-events-none" style={{
        background: "linear-gradient(180deg, transparent, oklch(0.85 0.2 330 / 0.15), transparent)",
        animation: "scan 6s linear infinite",
      }} />
    </div>
  );
}

export function MedievalScene({ scrollY }: { scrollY: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, oklch(0.2 0.08 50) 0%, oklch(0.08 0.06 30) 100%)" }} />
      {/* Mountains */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-2/3" preserveAspectRatio="none" viewBox="0 0 100 60" style={{ transform: `translateY(${scrollY * 0.04}px)` }}>
        <polygon points="0,60 0,40 15,20 30,35 45,15 60,30 80,18 100,32 100,60" fill="oklch(0.1 0.05 30)" />
        <polygon points="0,60 0,50 20,38 40,45 60,32 80,42 100,38 100,60" fill="oklch(0.15 0.06 40)" />
      </svg>
      {/* Castle silhouette */}
      <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2" style={{ transform: `translate(-50%, ${-scrollY * 0.08}px)` }}>
        <svg width="280" height="180" viewBox="0 0 280 180">
          <rect x="40" y="80" width="200" height="100" fill="oklch(0.15 0.05 40)" />
          <rect x="20" y="50" width="40" height="130" fill="oklch(0.18 0.05 40)" />
          <rect x="220" y="50" width="40" height="130" fill="oklch(0.18 0.05 40)" />
          <rect x="125" y="30" width="30" height="150" fill="oklch(0.2 0.06 40)" />
          <polygon points="20,50 40,30 60,50" fill="oklch(0.4 0.15 30)" />
          <polygon points="220,50 240,30 260,50" fill="oklch(0.4 0.15 30)" />
          <polygon points="125,30 140,10 155,30" fill="oklch(0.4 0.15 30)" />
          <rect x="130" y="120" width="20" height="40" fill="oklch(0.6 0.2 40)" />
        </svg>
      </div>
      {/* Banner text */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 font-display text-3xl md:text-5xl" style={{
        color: "oklch(0.85 0.15 70)",
        textShadow: "0 0 20px oklch(0.6 0.2 30)",
      }}>
        ⚔ Ye Olde Web ⚔
      </div>
    </div>
  );
}

export function UnderwaterScene({ scrollY }: { scrollY: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden water-distort">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, oklch(0.4 0.15 220) 0%, oklch(0.08 0.08 240) 80%)" }} />
      {/* Caustic light rays */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="absolute top-0 w-32 h-full opacity-30 animate-pulse-glow" style={{
          left: `${i * 22}%`,
          background: "linear-gradient(180deg, oklch(0.95 0.15 200 / 0.6), transparent)",
          transform: `skewX(${-15 + i * 3}deg) translateY(${scrollY * 0.03}px)`,
          animationDelay: `${i * 0.7}s`,
        }} />
      ))}
      {/* Coral */}
      <div className="absolute bottom-0 inset-x-0 h-1/3" style={{
        background: "radial-gradient(ellipse at center bottom, oklch(0.4 0.2 320) 0%, transparent 70%)",
        transform: `translateY(${scrollY * 0.06}px)`,
      }} />
      {/* Jellyfish */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="absolute animate-float-slow" style={{
          left: `${15 + i * 22}%`,
          top: `${20 + (i % 2) * 30}%`,
          animationDelay: `${i * 1.3}s`,
          transform: `translateY(${-scrollY * 0.1 * (i + 1) * 0.3}px)`,
        }}>
          <div className="w-16 h-12 rounded-t-full" style={{
            background: "radial-gradient(ellipse at top, oklch(0.85 0.18 320 / 0.7), oklch(0.6 0.2 280 / 0.3))",
            boxShadow: "0 0 40px oklch(0.75 0.2 320 / 0.6)",
          }} />
          <div className="flex justify-around opacity-60">
            {[0,1,2,3,4].map(t => <div key={t} className="w-px h-10" style={{ background: "oklch(0.85 0.18 320)" }} />)}
          </div>
        </div>
      ))}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 font-display text-3xl md:text-5xl" style={{
        color: "oklch(0.95 0.12 200)",
        textShadow: "0 0 30px oklch(0.7 0.2 200)",
      }}>
        ~ Abyssal Net ~
      </div>
    </div>
  );
}

export function SpaceScene({ scrollY }: { scrollY: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 30%, oklch(0.25 0.1 280) 0%, oklch(0.02 0.02 270) 80%)" }} />
      {/* Distant nebula */}
      <div className="absolute top-1/4 left-1/3 w-[60vw] h-[60vw] rounded-full opacity-40 animate-pulse-glow" style={{
        background: "radial-gradient(circle, oklch(0.5 0.25 320) 0%, transparent 60%)",
        transform: `translate(-50%, ${-scrollY * 0.05}px)`,
      }} />
      {/* Planet */}
      <div className="absolute right-[8%] top-[20%] w-40 h-40 md:w-72 md:h-72 rounded-full animate-spin-slow" style={{
        background: "radial-gradient(circle at 30% 30%, oklch(0.7 0.18 30), oklch(0.3 0.2 20) 70%, oklch(0.1 0.1 10))",
        boxShadow: "inset -30px -30px 80px oklch(0 0 0 / 0.7), 0 0 100px oklch(0.6 0.2 30 / 0.4)",
        transform: `translateY(${-scrollY * 0.12}px)`,
      }} />
      {/* Small moon */}
      <div className="absolute left-[15%] top-[55%] w-16 h-16 rounded-full" style={{
        background: "radial-gradient(circle at 30% 30%, oklch(0.85 0.05 280), oklch(0.4 0.05 270))",
        boxShadow: "0 0 50px oklch(0.85 0.1 280 / 0.5)",
        transform: `translateY(${-scrollY * 0.18}px)`,
      }} />
      <div className="absolute top-[15%] left-[10%] font-display text-3xl md:text-5xl" style={{
        color: "oklch(0.95 0.1 280)",
        textShadow: "0 0 30px oklch(0.7 0.25 300)",
      }}>
        ✦ Cosmos Sector 7 ✦
      </div>
    </div>
  );
}

export function NatureScene({ scrollY }: { scrollY: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, oklch(0.4 0.12 140) 0%, oklch(0.1 0.08 130) 100%)" }} />
      {/* Sun shafts */}
      <div className="absolute top-0 left-1/4 w-1/2 h-full opacity-30" style={{
        background: "linear-gradient(180deg, oklch(0.95 0.15 100 / 0.5), transparent 60%)",
        transform: `translateY(${scrollY * 0.02}px)`,
      }} />
      {/* Tree silhouettes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="absolute bottom-0" style={{
          left: `${i * 18 - 5}%`,
          width: "20%",
          height: `${50 + (i % 3) * 15}%`,
          background: "radial-gradient(ellipse at top, oklch(0.25 0.12 140) 0%, oklch(0.08 0.06 130) 70%)",
          transform: `translateY(${scrollY * 0.05}px)`,
        }} />
      ))}
      {/* Ruined screen with vines */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-72 md:w-[28rem] aspect-video border-4 rounded-lg" style={{
        background: "oklch(0.05 0.02 130 / 0.6)",
        borderColor: "oklch(0.3 0.1 140)",
        boxShadow: "0 0 60px oklch(0.5 0.2 100 / 0.3), inset 0 0 60px oklch(0 0 0 / 0.7)",
        transform: `translate(-50%, ${-scrollY * 0.08}px)`,
      }}>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs md:text-base" style={{ color: "oklch(0.7 0.2 140)", textShadow: "0 0 10px oklch(0.7 0.2 140)" }}>
          [ SIGNAL LOST · 2387 ]
        </div>
        {/* vines */}
        <div className="absolute -top-4 left-4 w-2 h-20 rounded-full" style={{ background: "oklch(0.4 0.15 130)" }} />
        <div className="absolute -bottom-6 right-8 w-2 h-24 rounded-full" style={{ background: "oklch(0.4 0.15 130)" }} />
      </div>
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 font-display text-3xl md:text-5xl" style={{
        color: "oklch(0.92 0.15 110)",
        textShadow: "0 0 25px oklch(0.5 0.2 130)",
      }}>
        🌿 Verdant Reclaim 🌿
      </div>
    </div>
  );
}

export function SceneWrapper({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className="universe-scene" style={{ opacity: active ? 1 : 0, transform: active ? "scale(1)" : "scale(1.05)" }}>
      {children}
    </div>
  );
}
