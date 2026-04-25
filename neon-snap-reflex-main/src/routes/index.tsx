import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameBoard, type GameResult } from "@/components/GameBoard";
import {
  COLOR_META,
  type ColorKey,
  type GameMode,
  MODES,
  getHighScore,
  pickRandom,
} from "@/lib/game";
import { initAudio, isMuted, setMuted, sfx, startMusic, stopMusic } from "@/lib/audio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Color Reflex Test — Neon Arcade Reaction Game" },
      {
        name: "description",
        content:
          "Tap only when the target color flashes. Beat your reflexes in this fast-paced neon arcade reaction game. Classic, Time Attack & Hardcore modes.",
      },
      { property: "og:title", content: "Color Reflex Test — Neon Arcade Reaction Game" },
      {
        property: "og:description",
        content:
          "Sharpen your reflexes. Tap only the target color in this addictive neon arcade game.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

type Screen = "landing" | "instructions" | "playing" | "result";

function Index() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [mode, setMode] = useState<GameMode>("classic");
  const [target, setTarget] = useState<ColorKey>("blue");
  const [result, setResult] = useState<GameResult | null>(null);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const startFlow = async (selectedMode: GameMode) => {
    await initAudio();
    setMode(selectedMode);
    const allColors: ColorKey[] = ["red", "blue", "green", "yellow", "purple", "pink", "cyan"];
    setTarget(pickRandom(allColors));
    sfx.start();
    setScreen("instructions");
  };

  const launchGame = async () => {
    await initAudio();
    startMusic(128);
    setScreen("playing");
  };

  const handleGameOver = (r: GameResult) => {
    setResult(r);
    stopMusic();
    setScreen("result");
  };

  const handleQuit = () => {
    stopMusic();
    setScreen("landing");
  };

  const playAgain = () => {
    const allColors: ColorKey[] = ["red", "blue", "green", "yellow", "purple", "pink", "cyan"];
    setTarget(pickRandom(allColors));
    setScreen("instructions");
  };

  return (
    <main className="min-h-screen w-full grid-bg animate-scan-bg relative overflow-hidden">
      {/* Mute */}
      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute audio" : "Mute audio"}
        className="fixed top-3 right-3 z-50 w-10 h-10 rounded-full border border-border bg-card/70 backdrop-blur flex items-center justify-center text-base hover:scale-110 transition"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {screen === "landing" && <Landing onStart={startFlow} />}
      {screen === "instructions" && (
        <Instructions mode={mode} target={target} onPlay={launchGame} onBack={() => setScreen("landing")} />
      )}
      {screen === "playing" && (
        <GameBoard mode={mode} target={target} onExit={handleQuit} onGameOver={handleGameOver} />
      )}
      {screen === "result" && result && (
        <ResultScreen result={result} onPlayAgain={playAgain} onHome={() => setScreen("landing")} />
      )}
    </main>
  );
}

function Landing({ onStart }: { onStart: (m: GameMode) => void }) {
  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <h1
        className="font-arcade text-3xl sm:text-5xl md:text-6xl leading-tight neon-text"
        style={{ color: "var(--neon-pink)" }}
      >
        COLOR
        <br />
        <span style={{ color: "var(--neon-cyan)" }}>REFLEX</span>
        <br />
        <span style={{ color: "var(--neon-yellow)" }}>TEST</span>
      </h1>
      <p className="mt-8 max-w-md text-sm sm:text-base text-muted-foreground">
        Colors flash. Stay sharp. Tap{" "}
        <span className="neon-text-soft" style={{ color: "var(--neon-green)" }}>
          ONLY
        </span>{" "}
        when the target color appears.
      </p>

      <div className="mt-10 grid gap-3 w-full max-w-sm">
        {(Object.keys(MODES) as GameMode[]).map((m) => {
          const cfg = MODES[m];
          const hs = getHighScore(m);
          const accent =
            m === "classic" ? "var(--neon-cyan)" : m === "timeattack" ? "var(--neon-yellow)" : "var(--neon-red)";
          return (
            <button
              key={m}
              onClick={() => onStart(m)}
              className="group relative px-5 py-4 rounded-xl bg-card/60 border-2 backdrop-blur transition hover:scale-[1.02] active:scale-[0.98] text-left"
              style={{ borderColor: accent, color: accent }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-arcade text-sm sm:text-base neon-text-soft">{cfg.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-display">{cfg.tagline}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">HI-SCORE</div>
                  <div className="font-arcade text-sm">{hs.toString().padStart(4, "0")}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-10 text-[10px] text-muted-foreground font-arcade">▸ TAP A MODE TO BEGIN ◂</p>
    </section>
  );
}

function Instructions({
  mode,
  target,
  onPlay,
  onBack,
}: {
  mode: GameMode;
  target: ColorKey;
  onPlay: () => void;
  onBack: () => void;
}) {
  const cfg = MODES[mode];
  const meta = COLOR_META[target];

  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="text-xs font-arcade text-muted-foreground">{cfg.name.toUpperCase()} MODE</div>
      <h2
        className="mt-2 font-arcade text-xl sm:text-2xl neon-text-soft"
        style={{ color: "var(--neon-cyan)" }}
      >
        GET READY
      </h2>

      <ul className="mt-8 space-y-3 max-w-sm text-sm sm:text-base text-foreground/90">
        <li>👀 Watch the colors carefully</li>
        <li>👆 Tap ONLY when you see the target color</li>
        <li>⚡ Speed increases as you score</li>
        <li>😈 Don't panic</li>
      </ul>

      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="text-xs font-arcade text-muted-foreground">TARGET COLOR</div>
        <div
          className="px-8 py-6 rounded-2xl font-arcade text-xl sm:text-2xl animate-pulse-glow neon-border"
          style={{ color: meta.var, backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)" }}
        >
          {meta.emoji} {meta.label}
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-border text-muted-foreground font-arcade text-xs hover:text-foreground transition"
        >
          ← BACK
        </button>
        <button
          onClick={onPlay}
          className="px-8 py-3 rounded-xl font-arcade text-sm neon-border animate-pulse-glow"
          style={{ color: "var(--neon-green)", backgroundColor: "color-mix(in oklab, var(--neon-green) 10%, transparent)" }}
        >
          ▶ PLAY
        </button>
      </div>
    </section>
  );
}

function ResultScreen({
  result,
  onPlayAgain,
  onHome,
}: {
  result: GameResult;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const share = async () => {
    const text = `I scored ${result.score} in Color Reflex Test 🔥 (Streak: ${result.maxStreak}, Accuracy: ${result.accuracy}%) — can you beat me?`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Color Reflex Test", text, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert("Copied to clipboard!");
    } catch {
      // ignore
    }
  };

  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="font-arcade text-xs text-muted-foreground">GAME OVER</div>
      {result.newHighScore && (
        <div
          className="mt-2 font-arcade text-sm animate-pulse-glow neon-text"
          style={{ color: "var(--neon-yellow)" }}
        >
          ★ NEW HIGH SCORE ★
        </div>
      )}

      <div
        className="mt-6 font-arcade text-5xl sm:text-7xl neon-text"
        style={{ color: "var(--neon-pink)" }}
      >
        {result.score}
      </div>
      <div className="mt-1 text-xs text-muted-foreground font-arcade">
        HI {result.highScore.toString().padStart(4, "0")}
      </div>

      <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-sm">
        <Stat label="STREAK" value={result.maxStreak.toString()} color="var(--neon-yellow)" />
        <Stat label="ACCURACY" value={`${result.accuracy}%`} color="var(--neon-green)" />
        <Stat label="HITS" value={result.hits.toString()} color="var(--neon-cyan)" />
      </div>

      <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onPlayAgain}
          className="px-6 py-3 rounded-xl font-arcade text-sm neon-border"
          style={{ color: "var(--neon-green)", backgroundColor: "color-mix(in oklab, var(--neon-green) 10%, transparent)" }}
        >
          ▶ PLAY AGAIN
        </button>
        <button
          onClick={share}
          className="px-6 py-3 rounded-xl font-arcade text-sm neon-border"
          style={{ color: "var(--neon-cyan)", backgroundColor: "color-mix(in oklab, var(--neon-cyan) 10%, transparent)" }}
        >
          📤 CHALLENGE FRIENDS
        </button>
        <button
          onClick={onHome}
          className="px-6 py-3 rounded-xl font-arcade text-xs text-muted-foreground hover:text-foreground transition"
        >
          ↩ MAIN MENU
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-xl border-2 p-3 bg-card/40 backdrop-blur"
      style={{ borderColor: color, color }}
    >
      <div className="text-[10px] text-muted-foreground font-arcade">{label}</div>
      <div className="font-arcade text-base sm:text-lg neon-text-soft mt-1">{value}</div>
    </div>
  );
}
