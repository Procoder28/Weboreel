import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GameCanvas, type GameStats } from "@/game/GameCanvas";
import {
  resumeAudio, startMusic, stopMusic, sfxCountdown, setMusicIntensity,
} from "@/game/audio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Endless Neon Racer — Drive. Dodge. Survive." },
      { name: "description", content: "A fast-paced cyberpunk arcade racer. Dodge neon traffic, chain near misses, and chase the high score." },
      { property: "og:title", content: "Endless Neon Racer" },
      { property: "og:description", content: "Pure speed dopamine. One more try." },
    ],
  }),
  component: Index,
});

type Phase = "landing" | "countdown" | "playing" | "gameover";

function Index() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [count, setCount] = useState(3);
  const [stats, setStats] = useState<GameStats>({ distance: 0, speed: 6, maxSpeed: 6, nearMisses: 0, score: 0 });
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const gameKey = useRef(0);

  useEffect(() => {
    const hs = Number(localStorage.getItem("enr.highscore") || 0);
    setHighScore(hs);
  }, []);

  const startCountdown = async () => {
    await resumeAudio();
    startMusic();
    setMusicIntensity(0.1);
    setPhase("countdown");
    setCount(3);
    sfxCountdown(false);
    let n = 3;
    const id = window.setInterval(() => {
      n--;
      if (n <= 0) {
        window.clearInterval(id);
        sfxCountdown(true);
        setCount(0);
        window.setTimeout(() => {
          gameKey.current++;
          setPhase("playing");
        }, 500);
      } else {
        sfxCountdown(false);
        setCount(n);
      }
    }, 800);
  };

  const handleGameOver = (s: GameStats) => {
    setFinalStats(s);
    setMusicIntensity(0);
    stopMusic();
    setPhase("gameover");
    if (s.score > highScore) {
      setHighScore(s.score);
      localStorage.setItem("enr.highscore", String(s.score));
    }
  };

  const restart = () => {
    setFinalStats(null);
    startCountdown();
  };

  const share = async () => {
    if (!finalStats) return;
    const text = `I survived ${finalStats.distance.toLocaleString()}m in Endless Neon Racer 🏎️🔥 Score: ${finalStats.score.toLocaleString()}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Endless Neon Racer", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg("Copied to clipboard!");
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
      {/* Persistent neon backdrop for non-playing screens */}
      {phase !== "playing" && phase !== "gameover" && <NeonBackdrop />}

      {/* Game canvas mounts only while playing or showing crash */}
      {(phase === "playing" || phase === "gameover") && (
        <GameCanvas
          key={gameKey.current}
          onGameOver={handleGameOver}
          onStatsUpdate={setStats}
          paused={phase !== "playing"}
        />
      )}

      {/* HUD */}
      {phase === "playing" && <HUD stats={stats} highScore={highScore} />}

      {/* Landing */}
      {phase === "landing" && (
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center animate-flicker">
          <p className="font-display text-xs tracking-[0.4em] text-neon-cyan">// SYSTEM ONLINE</p>
          <h1 className="font-display mt-4 text-5xl font-black sm:text-7xl md:text-8xl">
            <span className="text-neon-pink">ENDLESS</span><br />
            <span className="text-neon-cyan">NEON RACER</span>
          </h1>
          <p className="mt-6 max-w-md font-display text-sm tracking-widest text-muted-foreground sm:text-base">
            DRIVE · DODGE · SURVIVE
          </p>

          <button
            onClick={startCountdown}
            className="font-display group relative mt-12 overflow-hidden rounded-md border-2 border-[var(--neon-pink)] bg-transparent px-12 py-4 text-lg font-bold tracking-[0.3em] text-neon-pink transition-all hover:bg-[var(--neon-pink)] hover:text-background glow-pink active:scale-95"
          >
            START RACE
          </button>

          {highScore > 0 && (
            <div className="mt-10 font-display text-sm tracking-widest text-muted-foreground">
              HIGH SCORE: <span className="text-neon-cyan">{highScore.toLocaleString()}</span>
            </div>
          )}

          <div className="absolute bottom-6 left-0 right-0 font-display text-[10px] tracking-[0.3em] text-muted-foreground">
            ← → / A D / SWIPE / TAP
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      {phase === "countdown" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div
            key={count}
            className="font-display text-[12rem] font-black leading-none animate-pulse-glow"
            style={{ color: count === 0 ? "var(--neon-cyan)" : "var(--neon-pink)" }}
          >
            {count === 0 ? "GO" : count}
          </div>
        </div>
      )}

      {/* Game over */}
      {phase === "gameover" && finalStats && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm px-6">
          <div className="w-full max-w-md rounded-lg border-2 border-[var(--neon-pink)] bg-card/80 p-6 sm:p-8 glow-pink">
            <h2 className="font-display text-center text-4xl font-black text-neon-pink sm:text-5xl">
              CRASHED 💥
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 font-display">
              <Stat label="DISTANCE" value={`${finalStats.distance.toLocaleString()}m`} accent="cyan" />
              <Stat label="SCORE" value={finalStats.score.toLocaleString()} accent="pink" />
              <Stat label="MAX SPEED" value={`${finalStats.maxSpeed.toFixed(1)}x`} accent="purple" />
              <Stat label="NEAR MISSES" value={String(finalStats.nearMisses)} accent="cyan" />
            </div>
            <div className="mt-4 text-center font-display text-xs tracking-widest text-muted-foreground">
              HIGH SCORE: <span className="text-neon-cyan">{highScore.toLocaleString()}</span>
              {finalStats.score >= highScore && finalStats.score > 0 && (
                <span className="ml-2 text-neon-pink">NEW!</span>
              )}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={restart}
                className="font-display flex-1 rounded-md border-2 border-[var(--neon-cyan)] px-4 py-3 text-sm font-bold tracking-widest text-neon-cyan transition-all hover:bg-[var(--neon-cyan)] hover:text-background glow-cyan active:scale-95"
              >
                RACE AGAIN
              </button>
              <button
                onClick={share}
                className="font-display flex-1 rounded-md border-2 border-[var(--neon-pink)] px-4 py-3 text-sm font-bold tracking-widest text-neon-pink transition-all hover:bg-[var(--neon-pink)] hover:text-background active:scale-95"
              >
                SHARE SCORE
              </button>
            </div>
            {shareMsg && <p className="mt-3 text-center text-xs text-neon-cyan">{shareMsg}</p>}
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: "pink" | "cyan" | "purple" }) {
  const cls = accent === "pink" ? "text-neon-pink" : accent === "cyan" ? "text-neon-cyan" : "text-neon-purple";
  return (
    <div className="rounded border border-border bg-background/40 p-3 text-center">
      <div className="text-[10px] tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}

function HUD({ stats, highScore }: { stats: GameStats; highScore: number }) {
  const speedPct = Math.min(1, (stats.speed - 6) / 16);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-4 font-display">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-muted-foreground">SCORE</div>
          <div className="text-3xl font-black text-neon-cyan">{stats.score.toLocaleString()}</div>
          <div className="mt-1 text-[10px] tracking-widest text-muted-foreground">
            BEST <span className="text-neon-pink">{Math.max(highScore, stats.score).toLocaleString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-widest text-muted-foreground">DISTANCE</div>
          <div className="text-2xl font-bold text-neon-pink">{stats.distance.toLocaleString()}m</div>
          {stats.nearMisses > 0 && (
            <div className="mt-1 text-[10px] tracking-widest text-neon-cyan">
              NEAR × {stats.nearMisses}
            </div>
          )}
        </div>
      </div>
      {/* speed bar */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center justify-between text-[10px] tracking-widest text-muted-foreground">
          <span>SPEED</span>
          <span className="text-neon-cyan">{stats.speed.toFixed(1)}x</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full transition-all"
            style={{
              width: `${speedPct * 100}%`,
              background: "linear-gradient(90deg, var(--neon-cyan), var(--neon-pink))",
              boxShadow: "0 0 12px var(--neon-pink)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function NeonBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" style={{
        maskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 70%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 70%, transparent 100%)",
      }} />
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.28 340 / 0.55), transparent 70%)" }} />
      <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: "var(--neon-pink)", boxShadow: "0 0 20px var(--neon-pink)" }} />
      <div className="absolute inset-x-0 top-[calc(50%+1px)] h-24" style={{
        background: "linear-gradient(to bottom, oklch(0.72 0.28 340 / 0.25), transparent)",
      }} />
      {/* perspective road lines */}
      <svg className="absolute inset-x-0 bottom-0 h-1/2 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g stroke="oklch(0.88 0.18 200 / 0.6)" strokeWidth="0.3" fill="none">
          <line x1="50" y1="0" x2="20" y2="100" />
          <line x1="50" y1="0" x2="40" y2="100" />
          <line x1="50" y1="0" x2="60" y2="100" />
          <line x1="50" y1="0" x2="80" y2="100" />
        </g>
      </svg>
    </div>
  );
}
