import { useEffect, useRef, useState } from "react";
import { audioEngine, type UniverseKey } from "@/lib/audio-engine";
import { ParticleField } from "./ParticleField";
import {
  CyberpunkScene, MedievalScene, UnderwaterScene, SpaceScene, NatureScene, SceneWrapper,
} from "./Universes";

type Universe = {
  key: UniverseKey;
  name: string;
  tagline: string;
  particles: "stars" | "rain" | "embers" | "bubbles" | "cosmic" | "leaves";
};

const UNIVERSES: Universe[] = [
  { key: "intro",      name: "The Threshold",       tagline: "Every scroll changes reality.",         particles: "cosmic" },
  { key: "cyberpunk",  name: "Neo-2099",            tagline: "A neon city that never sleeps.",        particles: "rain" },
  { key: "medieval",   name: "Ye Olde Web",         tagline: "What if the internet was forged in iron?", particles: "embers" },
  { key: "underwater", name: "Abyssal Net",         tagline: "The web learned to breathe water.",     particles: "bubbles" },
  { key: "space",      name: "Cosmos Sector 7",     tagline: "Signals drift between the stars.",      particles: "stars" },
  { key: "nature",     name: "Verdant Reclaim",     tagline: "Where roots grew through the wires.",   particles: "leaves" },
];

export function MultiverseExperience() {
  const [started, setStarted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [portal, setPortal] = useState(false);
  const [showFinale, setShowFinale] = useState(false);
  const [favorite, setFavorite] = useState<UniverseKey | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastIdxRef = useRef(0);

  // Set body universe attribute
  useEffect(() => {
    document.body.dataset.universe = UNIVERSES[activeIdx].key;
  }, [activeIdx]);

  // Audio on universe change
  useEffect(() => {
    if (!started) return;
    audioEngine.transitionTo(UNIVERSES[activeIdx].key);
  }, [activeIdx, started]);

  // Scroll handler
  useEffect(() => {
    if (!started) return;
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      const vh = window.innerHeight;
      const idx = Math.min(UNIVERSES.length - 1, Math.floor((y + vh * 0.5) / vh));
      if (idx !== lastIdxRef.current) {
        lastIdxRef.current = idx;
        setPortal(true);
        setTimeout(() => setPortal(false), 900);
        setActiveIdx(idx);
      }
      // Reveal finale near bottom
      const max = document.body.scrollHeight - vh;
      setShowFinale(y > max - 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [started]);

  const begin = async () => {
    await audioEngine.start();
    await audioEngine.transitionTo("intro");
    setStarted(true);
  };

  const localScrollY = scrollY - activeIdx * window.innerHeight;
  const current = UNIVERSES[activeIdx];

  return (
    <div className="relative" style={{ cursor: started ? "default" : "default" }}>
      {/* Fixed scenes */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <SceneWrapper active={current.key === "intro"}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, oklch(0.18 0.12 290) 0%, oklch(0.04 0.03 270) 70%)" }} />
        </SceneWrapper>
        <SceneWrapper active={current.key === "cyberpunk"}><CyberpunkScene scrollY={localScrollY} /></SceneWrapper>
        <SceneWrapper active={current.key === "medieval"}><MedievalScene scrollY={localScrollY} /></SceneWrapper>
        <SceneWrapper active={current.key === "underwater"}><UnderwaterScene scrollY={localScrollY} /></SceneWrapper>
        <SceneWrapper active={current.key === "space"}><SpaceScene scrollY={localScrollY} /></SceneWrapper>
        <SceneWrapper active={current.key === "nature"}><NatureScene scrollY={localScrollY} /></SceneWrapper>
      </div>

      {/* Particles */}
      <ParticleField mode={current.particles} />

      {/* Portal flash */}
      <div className={`portal-overlay ${portal ? "active" : ""}`} style={{
        background: "radial-gradient(circle at center, oklch(1 0.2 290 / 0.6) 0%, oklch(0 0 0 / 0.95) 70%)",
      }} />

      {/* Universe label HUD */}
      {started && (
        <div className="fixed top-6 left-6 z-40 pointer-events-none animate-fade-up" key={current.key}>
          <div className="text-xs uppercase tracking-[0.3em] opacity-60">Universe {activeIdx + 1} / {UNIVERSES.length}</div>
          <div className="font-display text-2xl md:text-3xl mt-1">{current.name}</div>
          <div className="text-sm opacity-70 mt-1 max-w-xs">{current.tagline}</div>
        </div>
      )}

      {/* Progress bar */}
      {started && (
        <div className="fixed top-0 inset-x-0 h-1 z-40 bg-white/5">
          <div className="h-full transition-all" style={{
            width: `${((activeIdx + 1) / UNIVERSES.length) * 100}%`,
            background: "linear-gradient(90deg, var(--primary), var(--accent))",
            boxShadow: "0 0 20px var(--primary)",
          }} />
        </div>
      )}

      {/* Scroll hint */}
      {started && activeIdx === 0 && scrollY < 100 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 text-center animate-pulse-glow">
          <div className="text-xs uppercase tracking-[0.4em] opacity-80">Scroll</div>
          <div className="text-2xl mt-2">↓</div>
        </div>
      )}

      {/* Landing screen */}
      {!started && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, oklch(0.2 0.15 290) 0%, oklch(0.03 0.02 270) 80%)" }} />
          <ParticleField mode="cosmic" />
          <div className="relative z-10 animate-fade-up">
            <div className="text-xs md:text-sm uppercase tracking-[0.5em] opacity-70 mb-6">A cinematic experience</div>
            <h1 className="font-display text-5xl md:text-8xl glitch mb-4">The Multiverse Scroll</h1>
            <p className="text-base md:text-xl opacity-80 max-w-xl mx-auto mb-12">
              Five realities. One scroll. <br />Step through dimensions and let each universe rewrite the rules.
            </p>
            <button onClick={begin} className="btn-hero">Begin Journey</button>
            <div className="text-xs opacity-50 mt-6">Audio recommended · Headphones encouraged</div>
          </div>
        </div>
      )}

      {/* Scroll track — empty sections, one viewport tall each */}
      <div ref={trackRef} className="relative" style={{ zIndex: 10 }}>
        {UNIVERSES.map((u, i) => (
          <section key={u.key} className="h-screen w-full flex items-end justify-center pb-24 px-6 pointer-events-none">
            {i === UNIVERSES.length - 1 && started && (
              <div className="pointer-events-auto text-center animate-fade-up">
                <div className="font-display text-3xl md:text-5xl mb-4">Journey's end.</div>
                <div className="opacity-80 mb-6">You traveled through {UNIVERSES.length} alternate realities.</div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Finale overlay */}
      {showFinale && started && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 pointer-events-auto" style={{
          background: "linear-gradient(180deg, transparent 0%, oklch(0 0 0 / 0.85) 60%)",
        }}>
          <div className="max-w-2xl w-full text-center animate-fade-up">
            <div className="font-display text-3xl md:text-5xl mb-2">Which universe was your favorite?</div>
            <p className="opacity-70 mb-8">Pick a reality to remember it by.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {UNIVERSES.slice(1).map(u => (
                <button
                  key={u.key}
                  onClick={() => setFavorite(u.key)}
                  className="p-4 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: favorite === u.key ? "var(--primary)" : "oklch(1 0 0 / 0.15)",
                    background: favorite === u.key ? "oklch(1 0 0 / 0.1)" : "oklch(0 0 0 / 0.4)",
                    boxShadow: favorite === u.key ? "0 0 30px var(--primary)" : "none",
                  }}
                >
                  <div className="font-display text-lg">{u.name}</div>
                  <div className="text-xs opacity-60 mt-1">{u.tagline}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                className="btn-hero"
                onClick={() => {
                  const fav = UNIVERSES.find(u => u.key === favorite);
                  const text = fav
                    ? `I traveled through 5 alternate universes 🌌 My favorite was ${fav.name}.`
                    : `I traveled through 5 alternate universes 🌌`;
                  if (navigator.share) navigator.share({ title: "The Multiverse Scroll", text, url: location.href }).catch(() => {});
                  else { navigator.clipboard?.writeText(`${text} ${location.href}`); alert("Copied to clipboard!"); }
                }}
              >Share Journey</button>
              <button
                className="btn-hero"
                style={{ background: "transparent", border: "1px solid oklch(1 0 0 / 0.3)", color: "inherit", boxShadow: "none" }}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >Explore Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
