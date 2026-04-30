import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MoveButton } from "./MoveButton";
import { Scoreboard } from "./Scoreboard";
import { BattleStage } from "./BattleStage";
import { MatchHistory } from "./MatchHistory";
import { MOVES, decide, randomMove } from "./logic";
import type { Move, Outcome, Round, Scores } from "./types";

const STORAGE_KEY = "rps-arena-state-v1";
const BEST_OF = 5;
const TARGET = Math.ceil(BEST_OF / 2); // first to 3

interface PersistedState {
  scores: Scores;
  history: Round[];
  bestOfMode: boolean;
  matchOver: boolean;
}

const initialState: PersistedState = {
  scores: { player: 0, computer: 0, draws: 0 },
  history: [],
  bestOfMode: false,
  matchOver: false,
};

function loadState(): PersistedState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

export const Game = () => {
  const [state, setState] = useState<PersistedState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [computerMove, setComputerMove] = useState<Move | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [shaking, setShaking] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const matchOver = state.matchOver;

  const matchWinner = useMemo(() => {
    if (!state.bestOfMode) return null;
    if (state.scores.player >= TARGET) return "player" as const;
    if (state.scores.computer >= TARGET) return "computer" as const;
    return null;
  }, [state.bestOfMode, state.scores]);

  const play = useCallback(
    (move: Move) => {
      if (shaking || matchOver) return;

      setPlayerMove(move);
      setComputerMove(null);
      setOutcome(null);
      setShaking(true);

      timerRef.current = window.setTimeout(() => {
        const cpu = randomMove();
        const result = decide(move, cpu);
        setComputerMove(cpu);
        setOutcome(result);
        setShaking(false);

        setState((prev) => {
          const nextScores: Scores = {
            player: prev.scores.player + (result === "win" ? 1 : 0),
            computer: prev.scores.computer + (result === "lose" ? 1 : 0),
            draws: prev.scores.draws + (result === "draw" ? 1 : 0),
          };
          const round: Round = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            player: move,
            computer: cpu,
            outcome: result,
            at: Date.now(),
          };
          const nextHistory = [round, ...prev.history].slice(0, 5);

          let nextMatchOver = prev.matchOver;
          if (prev.bestOfMode) {
            if (nextScores.player >= TARGET || nextScores.computer >= TARGET) {
              nextMatchOver = true;
            }
          }
          return {
            ...prev,
            scores: nextScores,
            history: nextHistory,
            matchOver: nextMatchOver,
          };
        });
      }, 900);
    },
    [shaking, matchOver],
  );

  // Toast on match end
  useEffect(() => {
    if (state.matchOver && matchWinner) {
      toast(
        matchWinner === "player"
          ? "🏆 You won the match!"
          : "💀 CPU won the match",
        {
          description: `Final: ${state.scores.player} – ${state.scores.computer}`,
        },
      );
    }
  }, [state.matchOver, matchWinner, state.scores.player, state.scores.computer]);

  const reset = () => {
    setState((prev) => ({
      ...prev,
      scores: { player: 0, computer: 0, draws: 0 },
      history: [],
      matchOver: false,
    }));
    setPlayerMove(null);
    setComputerMove(null);
    setOutcome(null);
    setShaking(false);
    toast("Game reset", { description: "Scores and history cleared." });
  };

  const toggleBestOf = (checked: boolean) => {
    setState((prev) => ({
      ...prev,
      bestOfMode: checked,
      matchOver: false,
      scores: { player: 0, computer: 0, draws: 0 },
      history: [],
    }));
    setPlayerMove(null);
    setComputerMove(null);
    setOutcome(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top bar: scoreboard + controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        <div className="flex-1">
          <Scoreboard
            scores={state.scores}
            target={state.bestOfMode ? TARGET : null}
          />
        </div>
        <div className="arena-card rounded-2xl px-4 py-3 flex items-center justify-between gap-4 md:w-auto">
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4 text-accent" />
            <Label htmlFor="bestof" className="text-sm font-semibold cursor-pointer">
              Best of 5
            </Label>
            <Switch
              id="bestof"
              checked={state.bestOfMode}
              onCheckedChange={toggleBestOf}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Battle stage */}
      <div className="arena-card rounded-3xl p-6 sm:p-10">
        <BattleStage
          player={playerMove}
          computer={computerMove}
          outcome={outcome}
          shaking={shaking}
        />

        {/* Match over overlay */}
        {matchOver && matchWinner ? (
          <div className="mt-8 flex flex-col items-center gap-4 animate-fade-in">
            <div
              className="px-6 py-4 rounded-2xl border-2 flex items-center gap-3"
              style={{
                borderColor:
                  matchWinner === "player"
                    ? "hsl(var(--win) / 0.5)"
                    : "hsl(var(--lose) / 0.5)",
                background:
                  matchWinner === "player"
                    ? "hsl(var(--win) / 0.1)"
                    : "hsl(var(--lose) / 0.1)",
              }}
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-display text-lg font-bold">
                {matchWinner === "player" ? "Match won!" : "Match lost"} — {state.scores.player}:{state.scores.computer}
              </span>
            </div>
            <Button onClick={reset} size="lg" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Play again
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
            {MOVES.map((m) => (
              <MoveButton
                key={m}
                move={m}
                onClick={play}
                disabled={shaking}
              />
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <MatchHistory rounds={state.history} />
    </div>
  );
};