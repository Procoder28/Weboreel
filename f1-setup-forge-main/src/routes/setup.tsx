import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MuteButton } from "@/components/MuteButton";
import { F1Slider } from "@/components/F1Slider";
import { SegmentedControl } from "@/components/SegmentedControl";
import { StatBar } from "@/components/StatBar";
import { computeLive, DEFAULT_SETUP, Setup, TireType, TrackType, Weather } from "@/lib/simulation";
import { loadSetup, saveSetup } from "@/lib/storage";
import { playClick, playPress, playToggle, startEngineHum, stopEngineHum, unlockAudio } from "@/lib/audio";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Car Setup Panel — Build Your F1 Car Setup" },
      { name: "description", content: "Adjust aerodynamics, downforce, tire compound, fuel and weather. Watch live telemetry react." },
    ],
  }),
  component: SetupScreen,
});

function SetupScreen() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<Setup>(DEFAULT_SETUP);
  const live = useMemo(() => computeLive(setup), [setup]);

  useEffect(() => { setSetup(loadSetup()); }, []);
  useEffect(() => {
    unlockAudio();
    startEngineHum();
    return () => stopEngineHum();
  }, []);

  const update = <K extends keyof Setup>(k: K, v: Setup[K], sfx: "click" | "toggle" = "click") => {
    setSetup((p) => ({ ...p, [k]: v }));
    sfx === "toggle" ? playToggle() : playClick();
  };

  const onSimulate = () => {
    saveSetup(setup);
    playPress();
    stopEngineHum();
    navigate({ to: "/simulate" });
  };

  return (
    <main className="relative min-h-screen px-4 pt-6 pb-32 max-w-2xl mx-auto">
      <MuteButton />

      {/* Header */}
      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
        <Link to="/" onClick={() => playClick()} className="hover:text-electric transition-colors">◂ EXIT</Link>
        <span className="text-electric animate-flicker">◉ LIVE TELEMETRY</span>
      </div>

      <h1 className="mt-4 font-display font-black text-3xl uppercase tracking-tight">
        Car Setup <span className="text-neon">Panel</span>
      </h1>
      <p className="font-mono text-xs text-muted-foreground mt-1">Adjust parameters · Watch the data</p>

      {/* Track selector */}
      <div className="mt-6 hud-panel hud-corner p-4">
        <SegmentedControl<TrackType>
          label="Track Type"
          value={setup.track}
          onChange={(v) => update("track", v, "toggle")}
          options={[
            { value: "street", label: "Street", sub: "Tight" },
            { value: "balanced", label: "Balanced", sub: "Mixed" },
            { value: "speed", label: "Speed", sub: "Fast" },
          ]}
        />
      </div>

      {/* Live feedback */}
      <div className="mt-4 hud-panel hud-corner p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-xs tracking-[0.25em] uppercase">Live Telemetry</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">streaming</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <StatBar label="Top Speed" value={live.topSpeed} color="electric" />
          <StatBar label="Cornering" value={live.cornering} color="neon" />
          <StatBar label="Tire Wear" value={live.tireWear} color="amber" invert />
          <StatBar label="Stability" value={live.stability} color="success" />
        </div>
      </div>

      {/* Aero */}
      <div className="mt-4 hud-panel hud-corner p-5">
        <F1Slider
          label="Aerodynamics"
          min={0} max={100}
          value={setup.aero}
          onChange={(n) => update("aero", n)}
          leftHint="Slick · Top speed"
          rightHint="Wing · Grip"
          variant="neon"
        />
      </div>

      {/* Downforce */}
      <div className="mt-4 hud-panel hud-corner p-5">
        <F1Slider
          label="Downforce"
          min={0} max={100}
          value={setup.downforce}
          onChange={(n) => update("downforce", n)}
          leftHint="Straights"
          rightHint="Corners"
          variant="electric"
        />
      </div>

      {/* Tires */}
      <div className="mt-4 hud-panel hud-corner p-5">
        <SegmentedControl<TireType>
          label="Tire Compound"
          value={setup.tire}
          onChange={(v) => update("tire", v, "toggle")}
          options={[
            { value: "soft", label: "Soft", sub: "Fast · Fragile" },
            { value: "medium", label: "Medium", sub: "Balanced" },
            { value: "hard", label: "Hard", sub: "Slow · Durable" },
          ]}
        />
      </div>

      {/* Fuel */}
      <div className="mt-4 hud-panel hud-corner p-5">
        <F1Slider
          label="Fuel Load"
          min={20} max={100}
          value={setup.fuel}
          onChange={(n) => update("fuel", n)}
          leftHint="Light · Quick"
          rightHint="Full · Heavy"
          variant="amber"
        />
      </div>

      {/* Weather */}
      <div className="mt-4 hud-panel hud-corner p-5">
        <SegmentedControl<Weather>
          label="Weather"
          value={setup.weather}
          onChange={(v) => update("weather", v, "toggle")}
          options={[
            { value: "dry", label: "☀ Dry", sub: "Clear" },
            { value: "wet", label: "☂ Wet", sub: "Rain" },
          ]}
        />
      </div>

      {/* Sticky simulate */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onSimulate}
            className="group w-full flex items-center justify-between gap-3 px-6 py-4 rounded-md font-display font-bold text-base tracking-[0.2em] uppercase text-primary-foreground glow-neon transition-transform active:scale-[0.98]"
            style={{ background: "var(--gradient-neon)" }}
          >
            <span className="font-mono text-[10px] opacity-80">▸ READY</span>
            <span>Simulate Race</span>
            <span className="transition-transform group-hover:translate-x-1">▸▸</span>
          </button>
        </div>
      </div>
    </main>
  );
}
