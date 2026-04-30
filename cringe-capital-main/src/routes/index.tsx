import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingBuzzwords } from "@/components/FloatingBuzzwords";
import { FundingTicker } from "@/components/FundingTicker";
import { FakeChart } from "@/components/FakeChart";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { StartupBingo } from "@/components/StartupBingo";
import {
  StartupGenerator, LinkedInGenerator, PitchGenerator,
  MissionGenerator, JobTitleGenerator, FundingSimulator, RejectionGenerator,
} from "@/components/Generators";
import type { Mode } from "@/lib/generators";
import { startMusic, stopMusic, setMuted, isMuted, sfx } from "@/lib/sound";
import { ArrowDown, Volume2, VolumeX, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Corporate Buzzword Generator — Disrupting Synergy" },
      { name: "description", content: "Generate fake startups, LinkedIn cringe, investor pitches, and corporate jargon. The AI-native vibe layer for thought leaders." },
    ],
  }),
});

function Index() {
  const [mode, setMode] = useState<Mode>("silicon");
  const [muted, setMutedState] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  useEffect(() => () => stopMusic(), []);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const toggleMusic = () => {
    if (musicOn) { stopMusic(); setMusicOn(false); }
    else { startMusic(); setMusicOn(true); sfx.click(); }
  };

  const scrollToDash = () => {
    sfx.generate();
    document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-neon text-neon-foreground shadow-glow">
              <Sparkles className="size-4" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold">Synergy<span className="text-neon">.ai</span></div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">v4.20 · Series ∞</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={toggleMusic} className="text-xs">
              {musicOn ? "🎵 On" : "🎵 Off"}
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleMute} aria-label="Mute">
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
            <Button size="sm" onClick={scrollToDash} className="bg-gradient-neon text-neon-foreground hover:opacity-90">Launch <Zap className="ml-1 size-3" /></Button>
          </div>
        </div>
      </header>

      <FundingTicker />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div className="absolute inset-0 bg-gradient-mesh opacity-80" />
        <FloatingBuzzwords count={18} />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-neon" />
              Backed by <span className="font-bold">SoftBank's couch cushions</span>
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[0.95] tracking-tight text-gradient-hero sm:text-6xl md:text-7xl lg:text-8xl">
              Corporate Buzzword<br /><span className="text-gradient">Generator</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
              Disrupting synergy through AI-powered innovation. The vertically-integrated, agentic, cloud-first vibe layer for thought leaders. Now with 23% more nothing.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={scrollToDash} className="bg-gradient-neon text-neon-foreground shadow-glow hover:opacity-90">
                Generate Startup <ArrowDown className="ml-2 size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => { if (!musicOn) { toggleMusic(); } scrollToDash(); }} className="border-white/25 bg-white/5 text-white hover:bg-white/10">
                Enable Keynote Mode 🎤
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/50">
              {["As seen on TechCrunch (allegedly)", "ISO-9001 Vibes Certified", "GDPR-curious", "SOC 2 — Trust us bro"].map((t) => (
                <span key={t}>✓ {t}</span>
              ))}
            </div>
          </div>

          {/* Hero stats */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "ARR", v: "$0.00", d: "+∞%", t: "up" as const },
              { l: "MAU", v: "12.4M", d: "+340%", t: "up" as const },
              { l: "Burn Rate", v: "$2.1M/mo", d: "+89%", t: "up" as const },
              { l: "Vibes Index", v: "9.7/10", d: "+0.2", t: "up" as const },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <FakeChart label={s.l} value={s.v} delta={s.d} trend={s.t} seed={i * 7} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section id="dashboard" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Dashboard</div>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Your AI-native idea factory</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">Switch personas, generate nonsense, screenshot, post, repeat. The compounding moat is in the vibes.</p>
          </div>
          <ModeSwitcher value={mode} onChange={(m) => { setMode(m); sfx.click(); }} />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <StartupGenerator mode={mode} />
          <LinkedInGenerator mode={mode} />
          <PitchGenerator mode={mode} />
          <MissionGenerator mode={mode} />
          <JobTitleGenerator mode={mode} />
          <FundingSimulator mode={mode} />
          <RejectionGenerator mode={mode} />
          <div className="md:col-span-2 xl:col-span-2"><StartupBingo /></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="font-display text-lg font-bold">Synergy<span className="text-neon">.ai</span></div>
            <p className="max-w-md text-xs text-muted-foreground">
              "It sounds impressive… until you realize it means absolutely nothing." — Probably an investor
            </p>
            <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} Synergy.ai · Pre-revenue · Post-shame · Pivoting daily</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
