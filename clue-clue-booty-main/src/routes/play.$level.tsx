import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { LEVELS, TOTAL_LEVELS } from "@/game/levels";
import { loadState, saveState, type GameState } from "@/game/storage";
import treasureBg from "@/assets/treasure-bg.jpg";

export const Route = createFileRoute("/play/$level")({
  params: {
    parse: (raw) => z.object({ level: z.string() }).parse(raw),
    stringify: (p) => ({ level: String(p.level) }),
  },
  head: ({ params }) => ({
    meta: [
      { title: `Level ${params.level} — Treasure Hunt Quest` },
      { name: "description", content: `Solve the riddle of level ${params.level} and edge closer to the treasure.` },
    ],
  }),
  component: PlayLevel,
});

function PlayLevel() {
  const { level } = Route.useParams();
  const navigate = useNavigate();
  const levelNum = Math.max(1, Math.min(TOTAL_LEVELS, parseInt(level, 10) || 1));
  const data = LEVELS[levelNum - 1];

  const [state, setState] = useState<GameState | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef<number>(Date.now());

  // Hydrate state, redirect ahead-of-progress users
  useEffect(() => {
    const s = loadState();
    if (!s.startedAt) s.startedAt = Date.now();
    if (levelNum > s.currentLevel) {
      navigate({ to: "/play/$level", params: { level: String(s.currentLevel) }, replace: true });
      return;
    }
    s.currentLevel = levelNum;
    saveState(s);
    setState(s);
    startRef.current = Date.now();
    setSeconds(0);
    setAnswer("");
    setError(null);
    setShowHint(false);
  }, [levelNum, navigate]);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 250);
    return () => clearInterval(id);
  }, [levelNum]);

  const completedCount = state?.completedLevels.length ?? 0;
  const progress = useMemo(() => (completedCount / TOTAL_LEVELS) * 100, [completedCount]);

  if (!state) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = answer.trim().toLowerCase();
    if (!guess) return;
    const correct = data.answers.some((a) => a.toLowerCase() === guess);
    if (!correct) {
      setError("Arrr! That be the wrong answer, matey. Try again!");
      return;
    }
    // Score: base 1000, lose 10/sec, lose 200 per hint used at this level
    const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
    const hintPenalty = showHint ? 200 : 0;
    const earned = Math.max(100, 1000 - elapsed * 10 - hintPenalty);

    const next: GameState = {
      ...state,
      completedLevels: Array.from(new Set([...state.completedLevels, levelNum])),
      score: state.score + earned,
      currentLevel: Math.min(levelNum + 1, TOTAL_LEVELS),
      finishedAt: levelNum === TOTAL_LEVELS ? Date.now() : null,
    };
    saveState(next);
    if (levelNum === TOTAL_LEVELS) {
      navigate({ to: "/victory" });
    } else {
      navigate({ to: "/play/$level", params: { level: String(levelNum + 1) } });
    }
  };

  const useHint = () => {
    if (showHint) return;
    if (state.hintsRemaining <= 0) {
      setError("No hints left, ye must rely on yer wits!");
      return;
    }
    const next = { ...state, hintsRemaining: state.hintsRemaining - 1 };
    saveState(next);
    setState(next);
    setShowHint(true);
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <main
      className="relative min-h-screen bg-gradient-parchment"
      style={{
        backgroundImage: `linear-gradient(oklch(0.92 0.04 75 / 0.9), oklch(0.86 0.06 70 / 0.95)), url(${treasureBg})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between text-sm">
          <Link to="/" className="font-bold uppercase tracking-wider text-primary hover:text-accent">
            ← Quit
          </Link>
          <div className="flex items-center gap-4 font-bold text-primary">
            <span className="rounded-full bg-card/80 px-3 py-1 backdrop-blur-sm border border-border">
              ⏱ {mins}:{secs}
            </span>
            <span className="rounded-full bg-gradient-gold px-3 py-1 text-gold-foreground shadow-treasure">
              🏆 {state.score}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span>Voyage Progress</span>
            <span>{completedCount} / {TOTAL_LEVELS}</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Card */}
        <div className="animate-pop rounded-2xl border-2 border-border bg-card/90 p-6 shadow-treasure backdrop-blur-md md:p-10">
          <div className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-accent">
            Chapter {levelNum} of {TOTAL_LEVELS}
          </div>
          <h1 className="mb-6 text-3xl font-bold text-primary md:text-5xl">{data.title}</h1>

          <p className="mb-8 text-xl leading-relaxed text-foreground/90 md:text-2xl">
            {data.riddle}
          </p>

          {showHint && (
            <div className="mb-6 animate-pop rounded-lg border-l-4 border-accent bg-accent/10 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-accent">Hint</div>
              <div className="mt-1 text-foreground">{data.hint}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setError(null); }}
              placeholder="Yer answer, matey..."
              className={`h-14 text-lg ${error ? "animate-shake border-destructive" : ""}`}
              autoFocus
              autoComplete="off"
            />
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" variant="treasure" size="lg" className="flex-1">
                Submit Answer
              </Button>
              <Button
                type="button"
                variant="parchment"
                size="lg"
                onClick={useHint}
                disabled={showHint || state.hintsRemaining <= 0}
              >
                💡 Hint ({state.hintsRemaining} left)
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
