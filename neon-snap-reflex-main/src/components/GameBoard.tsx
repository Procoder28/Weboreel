import { useCallback, useEffect, useRef, useState } from "react";
import {
  COLOR_META,
  type ColorKey,
  type GameMode,
  MODES,
  getHighScore,
  pickRandom,
  setHighScore,
} from "@/lib/game";
import { sfx, startMusic, stopMusic, setMusicBpm } from "@/lib/audio";

type Status = "playing" | "over";

interface Props {
  mode: GameMode;
  target: ColorKey;
  onExit: () => void;
  onGameOver: (result: GameResult) => void;
}

export interface GameResult {
  mode: GameMode;
  target: ColorKey;
  score: number;
  maxStreak: number;
  accuracy: number;
  hits: number;
  misses: number;
  wrong: number;
  highScore: number;
  newHighScore: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface FloatText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const ALL_COLORS: ColorKey[] = ["red", "blue", "green", "yellow", "purple", "pink", "cyan"];

export function GameBoard({ mode, target, onExit, onGameOver }: Props) {
  const config = MODES[mode];
  const [current, setCurrent] = useState<ColorKey>(() => pickRandom(ALL_COLORS.filter((c) => c !== target)));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(config.startLives);
  const [timeLeft, setTimeLeft] = useState(config.duration ?? 0);
  const [interval, setIntervalMs] = useState(config.startInterval);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [status, setStatus] = useState<Status>("playing");

  const tappedThisFlashRef = useRef(false);
  const currentRef = useRef(current);
  const intervalRef = useRef(interval);
  const hitsRef = useRef(0);
  const wrongRef = useRef(0);
  const missesRef = useRef(0);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const livesRef = useRef(config.startLives);
  const flashTimerRef = useRef<number | null>(null);
  const idRef = useRef(0);

  currentRef.current = current;
  intervalRef.current = interval;

  const finish = useCallback(() => {
    if (status === "over") return;
    setStatus("over");
    stopMusic();
    sfx.gameOver();
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    const totalAttempts = hitsRef.current + missesRef.current + wrongRef.current;
    const accuracy = totalAttempts === 0 ? 0 : Math.round((hitsRef.current / totalAttempts) * 100);
    const prev = getHighScore(mode);
    const newHigh = scoreRef.current > prev;
    if (newHigh) setHighScore(mode, scoreRef.current);
    onGameOver({
      mode,
      target,
      score: scoreRef.current,
      maxStreak,
      accuracy,
      hits: hitsRef.current,
      misses: missesRef.current,
      wrong: wrongRef.current,
      highScore: Math.max(prev, scoreRef.current),
      newHighScore: newHigh,
    });
  }, [mode, target, maxStreak, onGameOver, status]);

  // Flash loop
  useEffect(() => {
    if (status !== "playing") return;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      // If previous flash was the target and user did NOT tap → miss
      if (currentRef.current === target && !tappedThisFlashRef.current) {
        missesRef.current += 1;
        sfx.miss();
        streakRef.current = 0;
        setStreak(0);
        if (config.endOnMistake) {
          finish();
          return;
        }
        livesRef.current -= 1;
        setLives(livesRef.current);
        scoreRef.current = Math.max(0, scoreRef.current - 5);
        setScore(scoreRef.current);
        if (livesRef.current <= 0) {
          finish();
          return;
        }
      }

      // pick next color (slight bias so target shows often enough)
      const roll = Math.random();
      let next: ColorKey;
      if (roll < 0.32) {
        next = target;
      } else {
        const others = ALL_COLORS.filter((c) => c !== target);
        next = pickRandom(others);
      }
      tappedThisFlashRef.current = false;
      setCurrent(next);
      sfx.tick();

      flashTimerRef.current = window.setTimeout(tick, intervalRef.current);
    };

    flashTimerRef.current = window.setTimeout(tick, intervalRef.current);
    return () => {
      cancelled = true;
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [status, target, config.endOnMistake, finish]);

  // Time-attack countdown
  useEffect(() => {
    if (status !== "playing" || !config.duration) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status, config.duration, finish]);

  const handleTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (status !== "playing") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++idRef.current;

    const isCorrect = currentRef.current === target && !tappedThisFlashRef.current;
    tappedThisFlashRef.current = true;

    if (isCorrect) {
      hitsRef.current += 1;
      const gain = 10 + Math.floor(streakRef.current * 0.5);
      scoreRef.current += gain;
      streakRef.current += 1;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      setMaxStreak((m) => Math.max(m, streakRef.current));
      setFeedback("correct");
      sfx.correct();
      if (streakRef.current > 0 && streakRef.current % 5 === 0) sfx.combo(streakRef.current);

      // speed up
      if (hitsRef.current % config.speedUpEvery === 0) {
        const next = Math.max(config.minInterval, intervalRef.current - config.speedUpAmount);
        setIntervalMs(next);
        setMusicBpm(128 + (config.startInterval - next) * 0.4);
      }

      setRipples((r) => [...r, { id, x, y, color: "var(--neon-green)" }]);
      setFloats((f) => [
        ...f,
        { id, x, y, text: `+${gain}${streakRef.current >= 5 ? " 🔥" : ""}`, color: "var(--neon-green)" },
      ]);
    } else {
      wrongRef.current += 1;
      streakRef.current = 0;
      setStreak(0);
      setFeedback("wrong");
      sfx.wrong();
      if (config.endOnMistake) {
        scoreRef.current = scoreRef.current; // no change
        finish();
        return;
      }
      livesRef.current -= 1;
      setLives(livesRef.current);
      scoreRef.current = Math.max(0, scoreRef.current - 8);
      setScore(scoreRef.current);
      setRipples((r) => [...r, { id, x, y, color: "var(--neon-red)" }]);
      setFloats((f) => [...f, { id, x, y, text: "Wrong!", color: "var(--neon-red)" }]);
      if (livesRef.current <= 0) {
        finish();
        return;
      }
    }

    if ("vibrate" in navigator) navigator.vibrate(isCorrect ? 15 : [25, 30, 25]);
    setTimeout(() => setFeedback(null), 360);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700);
    setTimeout(() => setFloats((f) => f.filter((fl) => fl.id !== id)), 950);
  };

  const meta = COLOR_META[current];
  const targetMeta = COLOR_META[target];

  return (
    <div
      className={`fixed inset-0 overflow-hidden touch-none scanlines ${
        feedback === "correct" ? "animate-flash-correct" : ""
      } ${feedback === "wrong" ? "animate-flash-wrong animate-shake" : ""}`}
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-start justify-between text-xs sm:text-sm font-arcade">
        <div className="flex flex-col gap-1">
          <div className="text-muted-foreground">SCORE</div>
          <div className="text-2xl sm:text-3xl neon-text-soft" style={{ color: "var(--neon-cyan)" }}>
            {score.toString().padStart(4, "0")}
          </div>
          <div className="text-muted-foreground mt-1">STREAK</div>
          <div
            className={`text-lg ${streak >= 5 ? "neon-text animate-pulse-glow" : ""}`}
            style={{ color: "var(--neon-yellow)" }}
          >
            {streak} {streak >= 5 ? "🔥" : ""}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-muted-foreground">TARGET</div>
          <div
            className="px-3 py-2 rounded-lg neon-border font-arcade text-sm sm:text-base animate-pulse-glow"
            style={{ color: targetMeta.var, backgroundColor: "color-mix(in oklab, var(--background) 70%, transparent)" }}
          >
            {targetMeta.label}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {config.duration ? (
            <>
              <div className="text-muted-foreground">TIME</div>
              <div
                className={`text-2xl sm:text-3xl neon-text-soft ${timeLeft <= 10 ? "animate-pulse-glow" : ""}`}
                style={{ color: timeLeft <= 10 ? "var(--neon-red)" : "var(--neon-pink)" }}
              >
                {timeLeft}s
              </div>
            </>
          ) : (
            <>
              <div className="text-muted-foreground">LIVES</div>
              <div className="text-xl" style={{ color: "var(--neon-red)" }}>
                {"♥".repeat(Math.max(0, lives))}
                <span className="opacity-20">{"♥".repeat(Math.max(0, config.startLives - lives))}</span>
              </div>
            </>
          )}
          <button
            onClick={onExit}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground transition"
          >
            ✕ QUIT
          </button>
        </div>
      </div>

      {/* Color stage */}
      <div
        onPointerDown={handleTap}
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
      >
        <div
          className="absolute inset-12 sm:inset-24 rounded-3xl transition-[background-color,box-shadow] duration-75"
          style={{
            backgroundColor: meta.var,
            color: meta.var,
            boxShadow:
              current === target
                ? `0 0 60px ${meta.var}, 0 0 140px ${meta.var}, inset 0 0 40px color-mix(in oklab, white 25%, transparent)`
                : `0 0 30px ${meta.var}, inset 0 0 20px color-mix(in oklab, black 25%, transparent)`,
          }}
        />
        <div
          className="relative z-10 font-arcade text-3xl sm:text-5xl tracking-widest text-black/70 mix-blend-overlay select-none pointer-events-none"
        >
          {meta.label}
        </div>

        {ripples.map((r) => (
          <span
            key={r.id}
            className="absolute pointer-events-none rounded-full animate-ripple"
            style={{
              left: r.x - 30,
              top: r.y - 30,
              width: 60,
              height: 60,
              border: `2px solid ${r.color}`,
              boxShadow: `0 0 20px ${r.color}`,
            }}
          />
        ))}
        {floats.map((f) => (
          <span
            key={f.id}
            className="absolute pointer-events-none font-arcade text-sm sm:text-base animate-float-up neon-text-soft"
            style={{ left: f.x, top: f.y, color: f.color }}
          >
            {f.text}
          </span>
        ))}
      </div>
    </div>
  );
}
