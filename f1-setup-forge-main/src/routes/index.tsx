import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import garageHero from "@/assets/garage-hero.jpg";
import { MuteButton } from "@/components/MuteButton";
import { playPress, unlockAudio } from "@/lib/audio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Build Your F1 Car Setup — Race Engineer Simulator" },
      { name: "description", content: "Tune aerodynamics, downforce and tires. Simulate the lap. Beat your friends. A premium interactive F1 setup experience." },
      { property: "og:title", content: "Build Your F1 Car Setup" },
      { property: "og:description", content: "Every decision affects performance. Tune your car, run the lap, share your time." },
    ],
  }),
  component: Landing,
});

function Landing() {
  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <MuteButton />

      {/* Hero background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={garageHero}
          alt="Formula 1 pit garage at night"
          width={1920}
          height={1280}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 tele-grid opacity-20" />
      </div>

      <section className="relative z-10 flex flex-col min-h-screen px-5 pt-10 pb-12 max-w-2xl mx-auto">
        {/* Top HUD */}
        <div className="flex justify-between items-center font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase animate-flicker">
          <span className="text-electric">◉ TELEMETRY ONLINE</span>
          <span>SECTOR 01 / 03</span>
        </div>

        <div className="flex-1 flex flex-col justify-center mt-12">
          <div className="font-mono text-[10px] tracking-[0.4em] text-neon mb-4 animate-flicker">
            ▸ RACE ENGINEER MODE
          </div>
          <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight uppercase">
            Build Your
            <span className="block bg-gradient-to-r from-[var(--color-neon)] via-[var(--color-amber)] to-[var(--color-electric)] bg-clip-text text-transparent">
              F1 Car Setup
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md">
            Every decision affects performance. Tune aero, tires and downforce — then run the lap.
          </p>

          {/* Spec strip */}
          <div className="mt-10 hud-panel hud-corner p-4 grid grid-cols-3 gap-4">
            {[
              { k: "AERO", v: "TUNED" },
              { k: "TIRES", v: "DRY/WET" },
              { k: "TRACK", v: "3 TYPES" },
            ].map((s) => (
              <div key={s.k} className="text-center">
                <div className="font-mono text-[9px] tracking-widest text-muted-foreground">{s.k}</div>
                <div className="font-display text-sm font-bold text-electric mt-1">{s.v}</div>
              </div>
            ))}
          </div>

          <Link
            to="/setup"
            onClick={() => { unlockAudio(); playPress(); }}
            className="group relative mt-10 inline-flex items-center justify-center gap-3 px-8 py-5 rounded-md font-display font-bold text-lg tracking-[0.2em] uppercase text-primary-foreground glow-neon animate-pulse-neon transition-transform active:scale-[0.98]"
            style={{ background: "var(--gradient-neon)" }}
          >
            <span>Start Tuning</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-1">▸▸</span>
          </Link>

          <div className="mt-6 font-mono text-[10px] tracking-widest text-muted-foreground/70 text-center uppercase">
            Tap anywhere to enable audio · Headphones recommended
          </div>
        </div>

        {/* Bottom HUD */}
        <div className="mt-8 flex justify-between font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
          <span>v 1.0 · LIVE</span>
          <span className="text-electric">PIT WALL READY ◉</span>
        </div>
      </section>
    </main>
  );
}
