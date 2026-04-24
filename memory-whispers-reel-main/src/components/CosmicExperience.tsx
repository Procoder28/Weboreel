import { useEffect, useRef, useState } from "react";
import { CosmicAudio } from "@/lib/cosmic-audio";
import { CosmicWorld, STORY, type StoryBeat } from "@/lib/cosmic-world";

type Phase = "intro" | "playing" | "ended";

const STORAGE_KEY = "cosmic-memory-progress-v1";

export function CosmicExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<CosmicWorld | null>(null);
  const audioRef = useRef<CosmicAudio | null>(null);

  const [phase, setPhase] = useState<Phase>("intro");
  const [name, setName] = useState("");
  const [activeBeat, setActiveBeat] = useState<{ beat: StoryBeat; index: number } | null>(null);
  const [progress, setProgress] = useState({ visited: 0, total: STORY.length });
  const [shareCopied, setShareCopied] = useState(false);

  // Restore name from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { name?: string };
        if (data.name) setName(data.name);
      }
    } catch {
      // ignore
    }
  }, []);

  const begin = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name }));
    } catch {
      // ignore
    }

    const audio = new CosmicAudio();
    await audio.start();
    audioRef.current = audio;

    setPhase("playing");
    // give DOM a tick so container has size
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      worldRef.current = new CosmicWorld(containerRef.current, audio, {
        onCheckpoint: (beat, index) => {
          setActiveBeat({ beat, index });
          // auto-dismiss
          window.setTimeout(() => {
            setActiveBeat((cur) => (cur && cur.index === index ? null : cur));
          }, 5200);
        },
        onProgress: (visited, total) => setProgress({ visited, total }),
        onComplete: () => setPhase("ended"),
      });
    });
  };

  const restart = () => {
    worldRef.current?.dispose();
    worldRef.current = null;
    audioRef.current?.stop();
    audioRef.current = null;
    setActiveBeat(null);
    setProgress({ visited: 0, total: STORY.length });
    setPhase("intro");
  };

  const share = async () => {
    const url = window.location.href;
    const text = name
      ? `${name} just walked through their memories in this cosmic 3D experience.`
      : "I just walked through a cosmic 3D memory experience.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Step Into My World", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // user cancelled
    }
  };

  useEffect(() => {
    return () => {
      worldRef.current?.dispose();
      audioRef.current?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#050214] text-foreground">
      {/* 3D canvas mounts here */}
      <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />

      {/* Background gradient when intro/ended */}
      {phase !== "playing" && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, oklch(0.25 0.15 290 / 0.6), transparent 60%), radial-gradient(ellipse at 80% 80%, oklch(0.3 0.18 220 / 0.4), transparent 55%), #050214",
          }}
        />
      )}

      {/* Intro overlay */}
      {phase === "intro" && (
        <IntroScreen name={name} setName={setName} onStart={begin} />
      )}

      {/* HUD during play */}
      {phase === "playing" && (
        <>
          <Hud progress={progress} />
          {activeBeat && (
            <StoryCard
              key={activeBeat.index}
              beat={activeBeat.beat}
              name={name}
              onClose={() => setActiveBeat(null)}
            />
          )}
        </>
      )}

      {/* Ending */}
      {phase === "ended" && (
        <EndingScreen name={name} onReplay={restart} onShare={share} shareCopied={shareCopied} />
      )}
    </div>
  );
}

function IntroScreen({
  name,
  setName,
  onStart,
}: {
  name: string;
  setName: (v: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
      <div className="story-fade max-w-md">
        <p className="mb-3 text-xs uppercase tracking-[0.4em] text-muted-foreground">
          A Weboreel Experience
        </p>
        <h1 className="cosmic-text text-4xl font-semibold leading-tight sm:text-6xl">
          Step Into My World
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-foreground/70 sm:text-base">
          A small journey through memory, becoming, and the dreams that wait ahead.
        </p>

        <div className="mt-8 flex flex-col items-stretch gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            placeholder="Your name (optional)"
            className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-foreground placeholder:text-foreground/40 backdrop-blur outline-none transition focus:border-white/30 focus:bg-white/10"
          />
          <button
            onClick={onStart}
            className="cosmic-glow-shadow group relative w-full overflow-hidden rounded-full px-6 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(120deg, oklch(0.55 0.22 290), oklch(0.65 0.2 220), oklch(0.78 0.18 340))",
            }}
          >
            Begin Your Journey
          </button>
        </div>

        <div className="mt-8 space-y-1 text-xs text-foreground/50">
          <p>Move with WASD or the on-screen joystick</p>
          <p>Drag to look around · Walk into the lights</p>
        </div>
      </div>
    </div>
  );
}

function Hud({ progress }: { progress: { visited: number; total: number } }) {
  const pct = (progress.visited / progress.total) * 100;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center px-4 pt-5">
      <div className="rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-foreground/70 backdrop-blur">
        {progress.visited} / {progress.total} memories
      </div>
      <div className="mt-2 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, oklch(0.85 0.15 200), oklch(0.78 0.18 340))",
          }}
        />
      </div>
    </div>
  );
}

function StoryCard({
  beat,
  name,
  onClose,
}: {
  beat: StoryBeat;
  name: string;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-10 sm:pb-14">
      <div className="story-fade pointer-events-auto max-w-lg rounded-2xl border border-white/10 bg-black/45 p-5 text-center backdrop-blur-md sm:p-7">
        <p className="text-[10px] uppercase tracking-[0.4em] text-foreground/50">{beat.title}</p>
        <p className="mt-3 text-base leading-relaxed text-foreground sm:text-lg">
          {beat.body(name)}
        </p>
        <button
          onClick={onClose}
          className="mt-4 text-[11px] uppercase tracking-[0.3em] text-foreground/50 transition hover:text-foreground"
        >
          continue ↘
        </button>
      </div>
    </div>
  );
}

function EndingScreen({
  name,
  onReplay,
  onShare,
  shareCopied,
}: {
  name: string;
  onReplay: () => void;
  onShare: () => void;
  shareCopied: boolean;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
      <div className="story-fade max-w-lg">
        <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">
          {name ? `For ${name}` : "An ending"}
        </p>
        <h2 className="cosmic-text mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
          Every journey shapes who we become.
        </h2>
        <p className="mt-5 text-sm text-foreground/60 sm:text-base">
          Thank you for walking this small piece of the universe.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onReplay}
            className="w-full rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm text-foreground transition hover:bg-white/10 sm:w-auto"
          >
            Walk it again
          </button>
          <button
            onClick={onShare}
            className="cosmic-glow-shadow w-full rounded-full px-6 py-3 text-sm font-medium text-white transition hover:scale-[1.02] sm:w-auto"
            style={{
              background:
                "linear-gradient(120deg, oklch(0.55 0.22 290), oklch(0.78 0.18 340))",
            }}
          >
            {shareCopied ? "Link copied ✓" : "Share this journey"}
          </button>
        </div>
      </div>
    </div>
  );
}
