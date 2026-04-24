import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generateRound,
  getLevelConfig,
  calcScore,
  loadHighScore,
  saveHighScore,
  type LevelConfig,
} from "@/lib/game";
import {
  unlockAudio,
  startMusic,
  stopMusic,
  setMusicIntensity,
  setMuted,
  sfxFlash,
  sfxClick,
  sfxCorrect,
  sfxWrong,
  sfxTick,
  sfxGameOver,
} from "@/lib/audio";
import { Volume2, VolumeX, Zap, Trophy, Share2, RotateCcw, Play } from "lucide-react";

type Phase = "landing" | "instructions" | "ready" | "flash" | "recall" | "feedback" | "gameover";

export function MemoryFlashGame() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [highScore, setHighScore] = useState({ score: 0, level: 0 });

  const cfg = useMemo<LevelConfig>(() => getLevelConfig(level), [level]);
  const [round, setRound] = useState(() => generateRound(cfg));
  const [flashIdx, setFlashIdx] = useState(-1); // index into sequence currently shown; -1 between flashes
  const [selections, setSelections] = useState<number[]>([]); // grid indices in order
  const [timeLeft, setTimeLeft] = useState(cfg.recallSeconds);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [shake, setShake] = useState(false);
  const [accuracy, setAccuracy] = useState({ correct: 0, total: 0 });

  const recallStartRef = useRef(0);
  const tickRef = useRef<number | null>(null);

  // Load high score
  useEffect(() => {
    setHighScore(loadHighScore());
  }, []);

  // Music intensity tracks level
  useEffect(() => {
    setMusicIntensity(Math.min((level - 1) / 8, 1));
  }, [level]);

  // Mute
  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  // ============ Phase: flash ============
  const runFlashSequence = useCallback(
    async (cfg: LevelConfig, seq: string[]) => {
      for (let i = 0; i < seq.length; i++) {
        sfxFlash();
        setFlashIdx(i);
        await wait(cfg.flashMs);
        setFlashIdx(-1);
        await wait(cfg.gapMs);
      }
      // Move to recall
      setSelections([]);
      setTimeLeft(cfg.recallSeconds);
      recallStartRef.current = performance.now();
      setPhase("recall");
    },
    []
  );

  // Recall timer
  useEffect(() => {
    if (phase !== "recall") return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          handleRecallEnd(false);
          return 0;
        }
        if (t <= 4) sfxTick();
        return t - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleRecallEnd(submittedCorrect: boolean) {
    if (tickRef.current) clearInterval(tickRef.current);
    const msUsed = performance.now() - recallStartRef.current;
    const correct = submittedCorrect;

    setAccuracy((a) => ({ correct: a.correct + (correct ? 1 : 0), total: a.total + 1 }));

    if (correct) {
      const gained = calcScore(cfg, msUsed, true);
      setScore((s) => s + gained);
      sfxCorrect();
      setFeedback("correct");
      setPhase("feedback");
      setTimeout(() => {
        setFeedback(null);
        const next = level + 1;
        setLevel(next);
        const nextCfg = getLevelConfig(next);
        const nr = generateRound(nextCfg);
        setRound(nr);
        setSelections([]);
        setPhase("ready");
        setTimeout(() => startLevel(nextCfg, nr.sequence), 700);
      }, 900);
    } else {
      sfxWrong();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setFeedback("wrong");
      setTimeout(() => {
        sfxGameOver();
        stopMusic();
        saveHighScore(score, level);
        setHighScore(loadHighScore());
        setPhase("gameover");
      }, 700);
    }
  }

  function startLevel(c: LevelConfig, seq: string[]) {
    setPhase("flash");
    setFlashIdx(-1);
    runFlashSequence(c, seq);
  }

  // ============ Selection ============
  function onTileClick(gridIdx: number) {
    if (phase !== "recall") return;
    if (selections.includes(gridIdx)) return;
    sfxClick();
    const newSel = [...selections, gridIdx];
    setSelections(newSel);

    // Check correctness so far
    const expectedEmoji = round.sequence[newSel.length - 1];
    const pickedEmoji = round.grid[gridIdx];
    if (pickedEmoji !== expectedEmoji) {
      handleRecallEnd(false);
      return;
    }
    // Completed correctly
    if (newSel.length === round.sequence.length) {
      handleRecallEnd(true);
    }
  }

  // ============ Controls ============
  function startGame() {
    unlockAudio();
    startMusic();
    setMusicIntensity(0);
    setLevel(1);
    setScore(0);
    setAccuracy({ correct: 0, total: 0 });
    const c = getLevelConfig(1);
    const r = generateRound(c);
    setRound(r);
    setPhase("instructions");
  }

  function beginPlay() {
    setPhase("ready");
    setTimeout(() => startLevel(cfg, round.sequence), 600);
  }

  function playAgain() {
    startMusic();
    setLevel(1);
    setScore(0);
    setAccuracy({ correct: 0, total: 0 });
    const c = getLevelConfig(1);
    const r = generateRound(c);
    setRound(r);
    setPhase("ready");
    setTimeout(() => startLevel(c, r.sequence), 600);
  }

  async function shareScore() {
    sfxClick();
    const text = `🎮 I reached Level ${level} with ${score.toLocaleString()} points in Memory Flash! Can you beat me? ⚡`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Memory Flash", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        alert("Score copied to clipboard!");
      }
    } catch {
      /* cancelled */
    }
  }

  // ============ Render ============
  const accPct = accuracy.total === 0 ? 100 : Math.round((accuracy.correct / accuracy.total) * 100);
  const gridCols = round.grid.length <= 6 ? 3 : round.grid.length <= 9 ? 3 : round.grid.length <= 12 ? 4 : 4;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden grid-bg">
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-screen">
        <div className="h-full w-full" style={{ backgroundImage: "repeating-linear-gradient(0deg, white 0 1px, transparent 1px 3px)" }} />
      </div>

      {/* HUD */}
      {phase !== "landing" && phase !== "instructions" && (
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="glass rounded-xl px-3 py-2 text-xs sm:text-sm">
            <div className="text-muted-foreground">LEVEL</div>
            <div className="text-lg font-bold neon-text">{level}</div>
          </div>
          <div className="glass rounded-xl px-3 py-2 text-center text-xs sm:text-sm">
            <div className="text-muted-foreground">SCORE</div>
            <div className="text-lg font-bold neon-text">{score.toLocaleString()}</div>
          </div>
          <button
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => setMutedState((m) => !m)}
            className="glass btn-press flex h-10 w-10 items-center justify-center rounded-xl"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-primary" />}
          </button>
        </div>
      )}

      <main className={`relative z-0 flex min-h-[100dvh] w-full items-center justify-center px-4 py-20 ${shake ? "animate-shake" : ""}`}>
        {/* LANDING */}
        {phase === "landing" && (
          <div className="flex flex-col items-center gap-8 text-center animate-float-up">
            <div className="relative">
              <Zap className="absolute -left-12 -top-2 h-10 w-10 text-accent neon-text animate-pulse" />
              <h1 className="text-6xl sm:text-8xl font-black tracking-tight neon-text bg-clip-text text-transparent gradient-primary animate-bg-pan">
                MEMORY
              </h1>
              <h1 className="text-6xl sm:text-8xl font-black tracking-tight neon-text-danger -mt-2">
                FLASH
              </h1>
              <Zap className="absolute -right-12 -bottom-2 h-10 w-10 text-accent neon-text animate-pulse" />
            </div>
            <p className="max-w-md text-base sm:text-lg text-muted-foreground">
              Watch. Remember. <span className="text-destructive font-bold">Survive.</span>
            </p>
            <button
              onClick={startGame}
              className="btn-press group relative gradient-primary rounded-2xl px-12 py-5 text-xl font-bold text-primary-foreground animate-pulse-glow"
            >
              <span className="flex items-center gap-3">
                <Play className="h-6 w-6 fill-current" />
                START GAME
              </span>
            </button>
            {highScore.score > 0 && (
              <div className="glass rounded-xl px-5 py-3 text-sm">
                <Trophy className="mr-2 inline h-4 w-4 text-accent" />
                Best: <span className="font-bold neon-text">{highScore.score.toLocaleString()}</span> · Level {highScore.level}
              </div>
            )}
          </div>
        )}

        {/* INSTRUCTIONS */}
        {phase === "instructions" && (
          <div className="flex max-w-md flex-col items-center gap-6 text-center animate-float-up">
            <h2 className="text-4xl font-black neon-text">HOW TO PLAY</h2>
            <ul className="glass space-y-4 rounded-2xl p-6 text-left">
              <li className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <span>You'll see a flash sequence of images.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🧠</span>
                <span>Remember them <b className="text-primary">in order</b>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <span>Tap them on the grid. One mistake = game over.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🔥</span>
                <span>Each level is faster. Survive as long as you can.</span>
              </li>
            </ul>
            <button
              onClick={beginPlay}
              className="btn-press gradient-primary rounded-2xl px-10 py-4 text-lg font-bold text-primary-foreground animate-pulse-glow"
            >
              I'M READY
            </button>
          </div>
        )}

        {/* READY (between rounds) */}
        {phase === "ready" && (
          <div className="text-center animate-float-up">
            <div className="text-sm uppercase tracking-widest text-muted-foreground">Level</div>
            <div className="text-7xl font-black neon-text">{level}</div>
            <div className="mt-4 text-base text-muted-foreground">
              {cfg.sequenceLength} images · {Math.round(cfg.flashMs)}ms each
            </div>
            <div className="mt-6 text-2xl font-bold text-accent neon-text animate-pulse">GET READY...</div>
          </div>
        )}

        {/* FLASH */}
        {phase === "flash" && (
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Memorize</div>
            <div className="relative flex h-72 w-72 items-center justify-center">
              <div className="absolute inset-0 rounded-3xl glass neon-border" />
              {flashIdx >= 0 && (
                <div
                  key={flashIdx}
                  className="relative text-[10rem] leading-none animate-flash-in"
                >
                  {round.sequence[flashIdx]}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {round.sequence.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full transition-all ${
                    i <= flashIdx ? "bg-primary neon-border" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* RECALL */}
        {(phase === "recall" || phase === "feedback") && (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Tap in order
              </div>
              <div
                className={`glass flex items-center gap-2 rounded-xl px-3 py-1.5 ${
                  timeLeft <= 3 ? "text-destructive neon-text-danger animate-pulse" : "text-primary"
                }`}
              >
                <span className="text-xs">⏱</span>
                <span className="font-bold tabular-nums">{timeLeft}s</span>
              </div>
            </div>

            {/* Selection track */}
            <div className="flex w-full justify-center gap-2">
              {round.sequence.map((_, i) => {
                const picked = selections[i];
                const emoji = picked !== undefined ? round.grid[picked] : null;
                return (
                  <div
                    key={i}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all ${
                      emoji
                        ? "glass neon-border"
                        : "border-2 border-dashed border-border bg-transparent"
                    }`}
                  >
                    {emoji || <span className="text-xs text-muted-foreground">{i + 1}</span>}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div
              className={`grid w-full gap-3`}
              style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
            >
              {round.grid.map((emoji, i) => {
                const sel = selections.indexOf(i);
                const isSelected = sel >= 0;
                const isWrongTile =
                  feedback === "wrong" && isSelected && sel === selections.length - 1;
                return (
                  <button
                    key={i}
                    onClick={() => onTileClick(i)}
                    disabled={isSelected || phase !== "recall"}
                    className={`btn-press relative aspect-square rounded-2xl text-4xl sm:text-5xl transition-all ${
                      isSelected
                        ? isWrongTile
                          ? "gradient-danger animate-wrong"
                          : "gradient-primary animate-correct text-primary-foreground"
                        : "glass hover:neon-border-strong"
                    }`}
                  >
                    <span className={isSelected ? "opacity-50" : ""}>{emoji}</span>
                    {isSelected && (
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-xs font-bold neon-text">
                        {sel + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {feedback === "correct" && (
              <div className="text-3xl font-black neon-text-success animate-float-up">CORRECT! ✨</div>
            )}
            {feedback === "wrong" && (
              <div className="text-3xl font-black neon-text-danger animate-float-up">WRONG ❌</div>
            )}
          </div>
        )}

        {/* GAME OVER */}
        {phase === "gameover" && (
          <div className="flex w-full max-w-md flex-col items-center gap-5 text-center animate-float-up">
            <h2 className="text-5xl font-black neon-text-danger">GAME OVER</h2>

            <div className="glass w-full rounded-2xl p-5 neon-border">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Score</div>
                  <div className="text-2xl font-black neon-text">{score.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Level</div>
                  <div className="text-2xl font-black neon-text">{level}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Accuracy</div>
                  <div className="text-2xl font-black neon-text">{accPct}%</div>
                </div>
              </div>
            </div>

            <div className="glass w-full rounded-2xl p-4 text-left text-sm">
              <div className="mb-2 text-xs uppercase text-muted-foreground">Correct sequence</div>
              <div className="mb-3 flex flex-wrap gap-2 text-3xl">
                {round.sequence.map((e, i) => (
                  <span key={i} className="rounded-lg glass px-2 py-1">{e}</span>
                ))}
              </div>
              <div className="mb-2 text-xs uppercase text-muted-foreground">Your sequence</div>
              <div className="flex flex-wrap gap-2 text-3xl">
                {selections.length === 0 ? (
                  <span className="text-sm text-muted-foreground italic">— time ran out —</span>
                ) : (
                  selections.map((idx, i) => {
                    const correct = round.grid[idx] === round.sequence[i];
                    return (
                      <span
                        key={i}
                        className={`rounded-lg px-2 py-1 ${correct ? "gradient-success" : "gradient-danger"}`}
                      >
                        {round.grid[idx]}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {score >= highScore.score && score > 0 && (
              <div className="text-sm font-bold text-accent neon-text animate-pulse">🏆 NEW HIGH SCORE!</div>
            )}

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <button
                onClick={playAgain}
                className="btn-press flex-1 gradient-primary rounded-2xl px-6 py-4 font-bold text-primary-foreground animate-pulse-glow"
              >
                <RotateCcw className="mr-2 inline h-5 w-5" />
                PLAY AGAIN
              </button>
              <button
                onClick={shareScore}
                className="btn-press flex-1 glass rounded-2xl px-6 py-4 font-bold neon-border"
              >
                <Share2 className="mr-2 inline h-5 w-5 text-accent" />
                CHALLENGE FRIENDS
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function wait(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}
