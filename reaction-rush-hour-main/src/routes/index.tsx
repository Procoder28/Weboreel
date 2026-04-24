import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Game,
  head: () => ({
    meta: [
      { title: "1-Minute Addiction Game — Can You Survive 60 Seconds?" },
      {
        name: "description",
        content:
          "A fast-paced 60-second neon reaction game. Tap at the perfect moment, build combos, beat your high score.",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
    ],
  }),
});

type Phase = "start" | "playing" | "end";

const GAME_DURATION = 60;
const BEST_KEY = "addiction_game_best_v1";
const HISTORY_KEY = "addiction_game_history_v1";

function Game() {
  const [phase, setPhase] = useState<Phase>("start");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [best, setBest] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ id: number; text: string; kind: "perfect" | "good" | "miss" } | null>(
    null,
  );
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);

  // Moving bar state (0..1 position along track)
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const speedRef = useRef(0.5); // units per second (0..1 across track)
  const targetCenterRef = useRef(0.5);
  const targetSizeRef = useRef(0.18);
  const lastTsRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const fbIdRef = useRef(0);

  // Load best score
  useEffect(() => {
    try {
      const b = Number(localStorage.getItem(BEST_KEY) || "0");
      setBest(Number.isFinite(b) ? b : 0);
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(h)) setHistory(h.slice(0, 5));
    } catch {
      // ignore
    }
  }, []);

  const randomizeTarget = useCallback(() => {
    // place target somewhere not too close to current position
    const min = 0.12;
    const max = 0.88;
    let c = Math.random() * (max - min) + min;
    if (Math.abs(c - posRef.current) < 0.15) {
      c = c > 0.5 ? c - 0.2 : c + 0.2;
    }
    targetCenterRef.current = Math.min(max, Math.max(min, c));
  }, []);

  const applyDifficulty = useCallback((elapsed: number) => {
    // elapsed in seconds 0..60
    const t = Math.min(1, elapsed / GAME_DURATION);
    // speed: 0.45 -> 1.6 (with extra surge in last 10s)
    const base = 0.45 + t * 1.0;
    const surge = elapsed > 50 ? (elapsed - 50) * 0.06 : 0;
    speedRef.current = base + surge;
    // target size: 0.20 -> 0.07
    targetSizeRef.current = Math.max(0.07, 0.2 - t * 0.13);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  const endGame = useCallback(
    (finalScore: number, finalBestCombo: number) => {
      stopLoop();
      setPhase("end");
      try {
        const prevBest = Number(localStorage.getItem(BEST_KEY) || "0");
        if (finalScore > prevBest) {
          localStorage.setItem(BEST_KEY, String(finalScore));
          setBest(finalScore);
        }
        const prevHist: number[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        const next = [finalScore, ...(Array.isArray(prevHist) ? prevHist : [])].slice(0, 5);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        setHistory(next);
      } catch {
        // ignore
      }
      // touch unused setter to avoid warning
      void finalBestCombo;
    },
    [stopLoop],
  );

  const loop = useCallback(
    (ts: number) => {
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
        startTimeRef.current = ts;
      }
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const elapsed = (ts - startTimeRef.current) / 1000;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(remaining);
      applyDifficulty(elapsed);

      // Random direction flip occasionally as difficulty increases
      const flipChance = Math.min(0.02, 0.002 + elapsed * 0.0004);
      if (Math.random() < flipChance) dirRef.current *= -1;

      posRef.current += dirRef.current * speedRef.current * dt;
      if (posRef.current >= 1) {
        posRef.current = 1;
        dirRef.current = -1;
      } else if (posRef.current <= 0) {
        posRef.current = 0;
        dirRef.current = 1;
      }

      // Update DOM directly for smoothness
      if (indicatorRef.current) {
        indicatorRef.current.style.left = `${posRef.current * 100}%`;
      }
      if (targetRef.current) {
        const sz = targetSizeRef.current * 100;
        targetRef.current.style.left = `${targetCenterRef.current * 100}%`;
        targetRef.current.style.width = `${sz}%`;
      }

      if (remaining <= 0) {
        endGame(scoreRef.current, bestComboRef.current);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [applyDifficulty, endGame],
  );

  // refs mirroring state for use inside RAF/handlers
  const scoreRef = useRef(0);
  const bestComboRef = useRef(0);
  const comboRef = useRef(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    bestComboRef.current = bestCombo;
  }, [bestCombo]);
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(GAME_DURATION);
    scoreRef.current = 0;
    comboRef.current = 0;
    bestComboRef.current = 0;
    posRef.current = 0;
    dirRef.current = 1;
    randomizeTarget();
    setPhase("playing");
    stopLoop();
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, randomizeTarget, stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  const showFeedback = useCallback((text: string, kind: "perfect" | "good" | "miss") => {
    fbIdRef.current += 1;
    setFeedback({ id: fbIdRef.current, text, kind });
    const id = fbIdRef.current;
    window.setTimeout(() => {
      setFeedback((f) => (f && f.id === id ? null : f));
    }, 600);
  }, []);

  const handleTap = useCallback(() => {
    if (phase !== "playing") return;
    const half = targetSizeRef.current / 2;
    const dist = Math.abs(posRef.current - targetCenterRef.current);
    const inside = dist <= half;
    if (inside) {
      // Closer to center = more points
      const accuracy = 1 - dist / half; // 0..1
      const perfect = accuracy > 0.55;
      const newCombo = comboRef.current + 1;
      const multiplier = 1 + Math.floor(newCombo / 5);
      const basePts = perfect ? 100 : 60;
      const gained = Math.round((basePts + accuracy * 50) * multiplier);
      const newScore = scoreRef.current + gained;
      scoreRef.current = newScore;
      comboRef.current = newCombo;
      if (newCombo > bestComboRef.current) bestComboRef.current = newCombo;
      setScore(newScore);
      setCombo(newCombo);
      setBestCombo((b) => Math.max(b, newCombo));
      setFlash(true);
      window.setTimeout(() => setFlash(false), 180);
      showFeedback(perfect ? `Perfect! +${gained}` : `+${gained}`, perfect ? "perfect" : "good");
      randomizeTarget();
      // Speed nudge each hit
      speedRef.current = Math.min(2.4, speedRef.current + 0.02);
    } else {
      comboRef.current = 0;
      setCombo(0);
      const penalty = Math.min(50, 20 + Math.floor(scoreRef.current * 0.005));
      const newScore = Math.max(0, scoreRef.current - penalty);
      scoreRef.current = newScore;
      setScore(newScore);
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      showFeedback("Miss", "miss");
    }
  }, [phase, randomizeTarget, showFeedback]);

  // Keyboard: space to tap, Enter to start/restart
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (phase === "playing") handleTap();
        else if (phase === "start") startGame();
        else if (phase === "end") startGame();
      } else if (e.code === "Enter" && phase !== "playing") {
        startGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleTap, startGame]);

  const urgent = phase === "playing" && timeLeft <= 10;
  const multiplier = 1 + Math.floor(combo / 5);

  return (
    <div className="game-root">
      <style>{css}</style>
      <div className={`game-shell ${shake ? "shake" : ""}`}>
        {/* HUD */}
        {phase === "playing" && (
          <div className="hud">
            <div className={`hud-item timer ${urgent ? "urgent" : ""}`}>
              <span className="hud-label">TIME</span>
              <span className="hud-value">{Math.ceil(timeLeft)}s</span>
            </div>
            <div className="hud-item score">
              <span className="hud-label">SCORE</span>
              <span className="hud-value">{score}</span>
            </div>
            <div className="hud-item combo">
              <span className="hud-label">COMBO</span>
              <span className="hud-value">
                {combo} <span className="mult">×{multiplier}</span>
              </span>
            </div>
          </div>
        )}

        {/* Stage */}
        <div
          className={`stage ${phase === "playing" ? "active" : ""} ${flash ? "flash" : ""}`}
          onPointerDown={(e) => {
            if (phase !== "playing") return;
            e.preventDefault();
            handleTap();
          }}
          style={{ touchAction: "manipulation" }}
        >
          {phase === "start" && (
            <div className="overlay">
              <h1 className="title">
                Can You Survive
                <br />
                <span className="title-accent">60 Seconds?</span>
              </h1>
              <p className="subtitle">Tap inside the glowing zone. Build combos. Don't blink.</p>
              <button
                className="cta"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startGame();
                }}
              >
                Tap to Start
              </button>
              {best > 0 && <p className="best-hint">Best: {best} — Can you beat your high score?</p>}
              <p className="hint">Spacebar works too</p>
            </div>
          )}

          {phase === "playing" && (
            <>
              <div className="track">
                <div ref={targetRef} className="target" />
                <div ref={indicatorRef} className="indicator" />
                <div className="track-line" />
              </div>
              <p className="tap-hint">Tap anywhere</p>
              {feedback && (
                <div key={feedback.id} className={`feedback ${feedback.kind}`}>
                  {feedback.text}
                </div>
              )}
            </>
          )}

          {phase === "end" && (
            <div className="overlay">
              <h2 className="end-title">Time's Up</h2>
              <div className="final-score">
                <span className="hud-label">FINAL SCORE</span>
                <span className="big-score">{score}</span>
              </div>
              <div className="end-stats">
                <div>
                  <span className="hud-label">BEST</span>
                  <span className="stat-value">{best}</span>
                </div>
                <div>
                  <span className="hud-label">TOP COMBO</span>
                  <span className="stat-value">{bestCombo}</span>
                </div>
              </div>
              {history.length > 0 && (
                <div className="history">
                  <span className="hud-label">RECENT ATTEMPTS</span>
                  <ul>
                    {history.map((h, i) => (
                      <li key={i} className={i === 0 ? "current" : ""}>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                className="cta"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startGame();
                }}
              >
                Play Again
              </button>
              <p className="best-hint">
                {score >= best && score > 0 ? "🔥 New high score!" : "Can you beat your high score?"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const css = `
  html, body { overscroll-behavior: none; }
  .game-root {
    position: fixed; inset: 0;
    background:
      radial-gradient(1200px 600px at 20% 10%, rgba(120, 60, 255, 0.25), transparent 60%),
      radial-gradient(900px 500px at 90% 90%, rgba(0, 220, 255, 0.22), transparent 60%),
      linear-gradient(180deg, #07060f 0%, #0b0a1a 100%);
    color: #e9e8ff;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    touch-action: manipulation;
  }
  .game-shell {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    padding: clamp(12px, 3vw, 28px);
    gap: clamp(12px, 3vh, 24px);
  }
  .game-shell.shake { animation: shake 0.35s cubic-bezier(.36,.07,.19,.97) both; }
  @keyframes shake {
    10%, 90% { transform: translate3d(-2px, 0, 0); }
    20%, 80% { transform: translate3d(4px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
    40%, 60% { transform: translate3d(8px, 0, 0); }
  }

  .hud {
    display: flex; justify-content: space-between; align-items: center;
    gap: 8px;
    padding: clamp(8px, 1.5vh, 14px) clamp(12px, 2.5vw, 20px);
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(140, 120, 255, 0.18);
    border-radius: 16px;
    backdrop-filter: blur(8px);
  }
  .hud-item { display: flex; flex-direction: column; align-items: center; min-width: 70px; }
  .hud-label { font-size: 10px; letter-spacing: 0.18em; color: #8b87b8; font-weight: 600; }
  .hud-value { font-size: clamp(20px, 3.5vw, 28px); font-weight: 800; letter-spacing: 0.02em; }
  .timer .hud-value { color: #7ef9ff; text-shadow: 0 0 12px rgba(126, 249, 255, 0.6); }
  .timer.urgent .hud-value { color: #ff5d8f; text-shadow: 0 0 16px rgba(255, 93, 143, 0.8); animation: pulse 0.6s ease-in-out infinite alternate; }
  .score .hud-value { color: #ffd166; text-shadow: 0 0 10px rgba(255, 209, 102, 0.5); }
  .combo .hud-value { color: #c8a2ff; text-shadow: 0 0 10px rgba(200, 162, 255, 0.5); }
  .mult { font-size: 0.7em; color: #ff7ed6; margin-left: 4px; }
  @keyframes pulse { from { opacity: 0.7; } to { opacity: 1; transform: scale(1.05); } }

  .stage {
    flex: 1;
    position: relative;
    border-radius: 24px;
    border: 1px solid rgba(140, 120, 255, 0.18);
    background:
      radial-gradient(600px 300px at 50% 50%, rgba(120, 90, 255, 0.10), transparent 70%),
      rgba(255,255,255,0.02);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: box-shadow 0.18s ease, background 0.18s ease;
  }
  .stage.active { cursor: crosshair; }
  .stage.flash {
    box-shadow: inset 0 0 80px rgba(126, 249, 255, 0.45), 0 0 60px rgba(126, 249, 255, 0.35);
    background: radial-gradient(600px 300px at 50% 50%, rgba(126, 249, 255, 0.18), transparent 70%);
  }

  .track {
    position: relative;
    width: min(92%, 900px);
    height: clamp(80px, 16vh, 140px);
  }
  .track-line {
    position: absolute; left: 0; right: 0; top: 50%;
    height: 4px; transform: translateY(-50%);
    background: linear-gradient(90deg, rgba(140,120,255,0.15), rgba(140,120,255,0.5), rgba(140,120,255,0.15));
    border-radius: 999px;
  }
  .target {
    position: absolute; top: 50%;
    height: 100%;
    transform: translate(-50%, -50%);
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(126, 249, 255, 0.22), rgba(200, 162, 255, 0.22));
    border: 2px solid rgba(126, 249, 255, 0.7);
    box-shadow: 0 0 30px rgba(126, 249, 255, 0.45), inset 0 0 20px rgba(200, 162, 255, 0.3);
    transition: width 0.25s ease, left 0.25s ease;
  }
  .indicator {
    position: absolute; top: 50%;
    width: clamp(18px, 4vw, 28px);
    height: clamp(56px, 12vh, 100px);
    transform: translate(-50%, -50%);
    border-radius: 8px;
    background: linear-gradient(180deg, #fff, #ffd166);
    box-shadow: 0 0 24px rgba(255, 209, 102, 0.9), 0 0 60px rgba(255, 126, 214, 0.5);
  }

  .tap-hint {
    position: absolute; bottom: clamp(14px, 4vh, 28px);
    font-size: 12px; letter-spacing: 0.25em; color: #6f6c9a;
    text-transform: uppercase;
  }

  .feedback {
    position: absolute; top: 28%;
    font-weight: 800; font-size: clamp(28px, 6vw, 48px);
    letter-spacing: 0.04em;
    pointer-events: none;
    animation: rise 0.6s ease-out forwards;
  }
  .feedback.perfect { color: #7ef9ff; text-shadow: 0 0 24px rgba(126, 249, 255, 0.9); }
  .feedback.good { color: #ffd166; text-shadow: 0 0 18px rgba(255, 209, 102, 0.7); }
  .feedback.miss { color: #ff5d8f; text-shadow: 0 0 18px rgba(255, 93, 143, 0.8); }
  @keyframes rise {
    0% { opacity: 0; transform: translateY(10px) scale(0.9); }
    20% { opacity: 1; transform: translateY(0) scale(1.05); }
    100% { opacity: 0; transform: translateY(-30px) scale(1); }
  }

  .overlay {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: clamp(16px, 4vw, 32px); gap: clamp(10px, 2vh, 18px);
    max-width: 92%;
  }
  .title {
    font-size: clamp(32px, 7vw, 64px);
    font-weight: 900; line-height: 1.05; margin: 0;
    letter-spacing: -0.02em;
  }
  .title-accent {
    background: linear-gradient(90deg, #7ef9ff, #c8a2ff, #ff7ed6);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    text-shadow: 0 0 40px rgba(200, 162, 255, 0.4);
  }
  .subtitle { color: #9d9ac9; font-size: clamp(14px, 2.4vw, 18px); margin: 0; }
  .cta {
    margin-top: 8px;
    min-height: 56px; padding: 0 clamp(24px, 5vw, 40px);
    font-size: clamp(16px, 2.6vw, 20px); font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: #0b0a1a; cursor: pointer;
    background: linear-gradient(90deg, #7ef9ff, #c8a2ff);
    border: none; border-radius: 999px;
    box-shadow: 0 0 32px rgba(126, 249, 255, 0.55), 0 0 60px rgba(200, 162, 255, 0.35);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    touch-action: manipulation;
  }
  .cta:hover { transform: translateY(-2px) scale(1.02); }
  .cta:active { transform: translateY(0) scale(0.98); }
  .best-hint { color: #c8a2ff; font-size: 13px; margin: 0; }
  .hint { color: #56547a; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; }

  .end-title {
    font-size: clamp(28px, 5vw, 44px); font-weight: 900; margin: 0;
    color: #ff7ed6; text-shadow: 0 0 24px rgba(255, 126, 214, 0.6);
  }
  .final-score { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .big-score {
    font-size: clamp(56px, 14vw, 120px); font-weight: 900; line-height: 1;
    background: linear-gradient(180deg, #fff, #ffd166);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    text-shadow: 0 0 40px rgba(255, 209, 102, 0.4);
  }
  .end-stats { display: flex; gap: clamp(20px, 6vw, 48px); }
  .end-stats > div { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .stat-value { font-size: clamp(20px, 3.6vw, 28px); font-weight: 800; color: #7ef9ff; }
  .history { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .history ul {
    list-style: none; padding: 0; margin: 0;
    display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
  }
  .history li {
    padding: 4px 10px; border-radius: 999px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(140,120,255,0.15);
    font-size: 13px; color: #b3b0dc; font-weight: 600;
  }
  .history li.current { color: #ffd166; border-color: rgba(255, 209, 102, 0.5); }
`;
