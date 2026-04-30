import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeThought, type WorldAnalysis, type World } from "@/lib/thoughtEngine";
import { audioEngine } from "@/lib/audioEngine";
import { ParticleField } from "./ParticleField";
import { WordEchoes } from "./WordEchoes";

type Phase = "landing" | "transition" | "world";

const WORLD_TITLES: Record<World, string> = {
  cosmic: "A Cosmic Drift",
  nostalgia: "A Golden Memory",
  melancholy: "A Quiet Rain",
  peace: "A Soft Stillness",
  hope: "A Rising Light",
  chaos: "A Charged Storm",
};

export function ThoughtExperience() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [text, setText] = useState("");
  const [liveWorld, setLiveWorld] = useState<World>("cosmic");
  const [analysis, setAnalysis] = useState<WorldAnalysis | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Live preview as user types
  const liveAnalysis = useMemo(() => (text.trim() ? analyzeThought(text) : null), [text]);

  useEffect(() => {
    if (liveAnalysis && phase === "landing") {
      setLiveWorld(liveAnalysis.world);
    }
  }, [liveAnalysis, phase]);

  // Apply world class to body
  useEffect(() => {
    const w = phase === "world" && analysis ? analysis.world : liveWorld;
    const cls = `world-${w}`;
    document.body.classList.remove("world-cosmic","world-nostalgia","world-melancholy","world-peace","world-hope","world-chaos");
    document.body.classList.add(cls);
    return () => document.body.classList.remove(cls);
  }, [liveWorld, analysis, phase]);

  const handleTransform = async () => {
    if (!text.trim()) return;
    await audioEngine.start();
    const a = analyzeThought(text);
    setAnalysis(a);
    audioEngine.setWorld(a.world, a.intensity);
    setPhase("transition");
    setTimeout(() => setPhase("world"), 3200);
  };

  const handleReset = () => {
    setPhase("landing");
    setText("");
    setAnalysis(null);
    setLiveWorld("cosmic");
    audioEngine.setWorld("cosmic", 0.4);
  };

  // Audio pulse on key press
  const lastKey = useRef(0);
  const onKey = () => {
    const now = Date.now();
    if (now - lastKey.current > 80 && audioEngine.isStarted()) {
      audioEngine.pulse();
      lastKey.current = now;
    }
  };

  const currentWorld = phase === "world" && analysis ? analysis.world : liveWorld;
  const intensity = liveAnalysis?.intensity ?? 0.4;
  const glitch = currentWorld === "chaos";

  return (
    <div ref={rootRef} className="relative min-h-screen overflow-hidden bg-world transition-[background] duration-[2000ms]">
      <ParticleField world={currentWorld} intensity={intensity} glitch={glitch} />

      {phase === "world" && analysis && <WordEchoes words={analysis.keywords} />}

      {/* Soft vignette */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 30%, color-mix(in oklab, var(--background) 80%, black) 100%)",
        zIndex: 2,
      }} />

      <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{ zIndex: 5 }}>
        {phase === "landing" && (
          <section className="w-full max-w-2xl mx-auto text-center animate-fade-up">
            <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground mb-6">Made From Your Thoughts</p>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6 glow-text">
              What's on
              <br />
              <span className="italic text-gradient">your mind?</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-md mx-auto">
              Type anything — a thought, a memory, a feeling.
              <br />The world will respond.
            </p>

            <div className="relative group">
              <div
                className="absolute -inset-2 rounded-3xl opacity-60 blur-2xl transition-opacity duration-1000 group-focus-within:opacity-100 animate-breathe"
                style={{ background: "var(--gradient-world)" }}
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKey}
                placeholder="I miss the summer when everything felt infinite..."
                rows={4}
                className="relative w-full resize-none rounded-3xl border border-border bg-card backdrop-blur-xl px-6 py-5 text-lg md:text-xl font-display placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all shadow-aura"
                style={{ caretColor: "var(--glow)" }}
              />
            </div>

            <button
              onClick={handleTransform}
              disabled={!text.trim()}
              className="mt-8 inline-flex items-center gap-3 px-10 py-4 rounded-full font-display text-lg tracking-wide bg-foreground text-background hover:bg-glow hover:text-background disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500 hover:scale-105 shadow-aura"
            >
              <span>Transform</span>
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>

            {liveAnalysis && (
              <p className="mt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground animate-fade-in-slow">
                Sensing · <span style={{ color: "var(--glow)" }}>{liveAnalysis.dominantFeeling}</span>
              </p>
            )}
          </section>
        )}

        {phase === "transition" && (
          <section className="text-center animate-fade-in-slow">
            <div className="relative w-32 h-32 mx-auto mb-10">
              <div className="absolute inset-0 rounded-full animate-breathe" style={{ background: "var(--gradient-world)", boxShadow: "var(--shadow-aura)" }} />
              <div className="absolute inset-4 rounded-full border border-border animate-pulse-soft" />
            </div>
            <h2 className="font-display text-3xl md:text-5xl glow-text mb-4">Building your world…</h2>
            <p className="text-muted-foreground text-sm tracking-widest uppercase">Listening to your thoughts</p>
          </section>
        )}

        {phase === "world" && analysis && (
          <section className="w-full max-w-3xl mx-auto text-center animate-fade-up">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-6">This world was made from your thoughts</p>
            <h2 className="font-display text-5xl md:text-7xl glow-text mb-6">
              {WORLD_TITLES[analysis.world]}
            </h2>
            <p className="font-display italic text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto mb-12">
              "{analysis.summary}"
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-xl mx-auto mb-12">
              <Stat label="Dominant Feeling" value={analysis.dominantFeeling} />
              <Stat label="Intensity" value={`${Math.round(analysis.intensity * 100)}%`} />
              <Stat label="World" value={analysis.world} />
            </div>

            {analysis.keywords.length > 0 && (
              <div className="mb-12">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Echoes from your mind</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {analysis.keywords.map((k) => (
                    <span key={k} className="px-4 py-1.5 rounded-full text-sm font-display italic border border-border bg-card backdrop-blur-md" style={{ color: "var(--glow)" }}>
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={async () => {
                  const shareText = `I turned my thoughts into a universe 🌌 — "${WORLD_TITLES[analysis.world]}" · ${analysis.dominantFeeling}`;
                  if (navigator.share) {
                    try { await navigator.share({ title: "Made From Your Thoughts", text: shareText, url: window.location.href }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
                  }
                }}
                className="px-8 py-3 rounded-full font-display text-lg bg-foreground text-background hover:scale-105 transition-transform shadow-aura"
              >
                Share My World
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-full font-display text-lg border border-border bg-card backdrop-blur-md hover:bg-secondary transition-all"
              >
                Create Another
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Floating ambient orb */}
      <div className="fixed bottom-8 right-8 w-3 h-3 rounded-full pointer-events-none animate-breathe" style={{ background: "var(--glow)", boxShadow: "0 0 30px var(--glow)", zIndex: 3 }} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card backdrop-blur-md p-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{label}</p>
      <p className="font-display text-base capitalize" style={{ color: "var(--glow)" }}>{value}</p>
    </div>
  );
}
