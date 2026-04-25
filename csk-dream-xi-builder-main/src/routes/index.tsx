import { createFileRoute, Link } from "@tanstack/react-router";
import stadium from "@/assets/stadium-hero.jpg";
import { useEffect } from "react";
import { startAmbient, playClick } from "@/lib/audio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Build Your Dream CSK XI — Pick Your Legends" },
      { name: "description", content: "Drag, drop and build your ultimate Chennai Super Kings XI. Get an AI rating and fan reactions." },
      { property: "og:title", content: "Build Your Dream CSK XI" },
      { property: "og:description", content: "Pick your legends. Build your squad." },
    ],
  }),
  component: Landing,
});

function Landing() {
  useEffect(() => {
    // Audio context cannot start until user interaction; we'll trigger on CTA tap.
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Hero image with heavy overlay */}
      <div className="absolute inset-0">
        <img
          src={stadium}
          alt="Stadium packed with yellow jerseys"
          width={1920}
          height={1080}
          className="w-full h-full object-cover scale-110 blur-sm opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-csk-navy-deep/60 via-csk-navy-deep/70 to-csk-black" />
      </div>

      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="animate-float-up max-w-2xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-csk-yellow/20 border border-csk-yellow/40 text-csk-yellow text-xs font-bold tracking-widest uppercase mb-6">
            Whistle Podu Edition
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-[0.95] mb-4">
            <span className="block text-foreground">Build Your</span>
            <span className="block text-shimmer">Dream CSK XI</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Pick your legends. Build your squad. Get an AI rating and unfiltered fan reactions.
          </p>

          <Link
            to="/builder"
            onClick={() => { startAmbient(); playClick(); }}
            className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-csk-yellow text-csk-navy-deep font-display text-lg font-bold tracking-wide animate-glow-pulse hover:scale-105 active:scale-95 transition-transform shadow-glow-yellow"
          >
            Start Building →
          </Link>

          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div><span className="text-csk-yellow font-bold">15+</span> Legends</div>
            <div className="w-px h-4 bg-border" />
            <div><span className="text-csk-yellow font-bold">AI</span> Powered</div>
            <div className="w-px h-4 bg-border" />
            <div><span className="text-csk-yellow font-bold">Share</span> Ready</div>
          </div>
        </div>
      </section>
    </main>
  );
}
