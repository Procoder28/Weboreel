import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Suspense, lazy } from "react";
import { Particles } from "@/components/Particles";
import { Button } from "@/components/ui/button";

// 3D scene is heavy — load lazily on the client only
const HeroScene = lazy(() =>
  import("@/components/HeroScene").then((m) => ({ default: m.HeroScene }))
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "1-Minute Skill Test AI — Can you solve it in 60 seconds?" },
      {
        name: "description",
        content:
          "Test your skills against the clock. AI-generated puzzles, instant feedback, percentile rankings. Beat the clock.",
      },
      { property: "og:title", content: "1-Minute Skill Test AI" },
      {
        property: "og:description",
        content: "AI-generated puzzles. 60 seconds. Instant feedback. Beat the clock.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/30 blur-[120px]" />
        <div className="absolute top-1/3 left-0 h-[400px] w-[400px] rounded-full bg-neon-blue/20 blur-[100px]" />
      </div>

      <Particles count={50} />

      {/* 3D scene — only on screens that can handle it */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full gradient-primary animate-pulse-glow" />
          <span className="text-sm font-semibold tracking-wide">SKILLTEST.AI</span>
        </div>
        <Link
          to="/leaderboard"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
        >
          Stats
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          AI-powered · Live now
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl"
        >
          Can You Solve It in{" "}
          <span className="gradient-text">60 Seconds?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl"
        >
          Test your skills. Beat the clock. Outsmart the AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link to="/play">
            <Button variant="hero" size="hero">
              Start Challenge →
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="ghostGlass" size="hero">
              View Leaderboard
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-4 text-center sm:gap-12"
        >
          {[
            { v: "60s", l: "Per round" },
            { v: "AI", l: "Instant judging" },
            { v: "∞", l: "Unique puzzles" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl font-bold gradient-text sm:text-3xl">{s.v}</div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
