import { useEffect, useState } from "react";
import type { Move, Outcome } from "./types";
import { MOVE_EMOJI, MOVE_LABEL } from "./logic";
import { cn } from "@/lib/utils";

interface Props {
  player: Move | null;
  computer: Move | null;
  outcome: Outcome | null;
  shaking: boolean;
}

const outcomeText: Record<Outcome, { title: string; color: string }> = {
  win: { title: "You Win!", color: "win" },
  lose: { title: "You Lose", color: "lose" },
  draw: { title: "It's a Draw", color: "draw" },
};

const Hand = ({
  move,
  side,
  shaking,
  reveal,
}: {
  move: Move | null;
  side: "left" | "right";
  shaking: boolean;
  reveal: boolean;
}) => {
  const display = shaking || !move ? "rock" : move;
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold">
        {side === "left" ? "You" : "CPU"}
      </span>
      <div
        className={cn(
          "w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center text-6xl sm:text-7xl md:text-8xl",
          "bg-gradient-to-br border-2",
          side === "left"
            ? "from-primary/20 to-primary-glow/10 border-primary/40"
            : "from-accent/20 to-primary/10 border-accent/40",
          shaking && (side === "left" ? "animate-shake-left" : "animate-shake-right"),
          !shaking && reveal && "animate-pop",
          side === "right" && !shaking && "scale-x-[-1]",
        )}
      >
        {MOVE_EMOJI[display]}
      </div>
    </div>
  );
};

export const BattleStage = ({ player, computer, outcome, shaking }: Props) => {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!shaking && outcome) {
      const t = setTimeout(() => setShowResult(true), 50);
      return () => clearTimeout(t);
    }
    setShowResult(false);
  }, [shaking, outcome]);

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-20 w-full">
        <Hand move={player} side="left" shaking={shaking} reveal={!shaking && !!outcome} />
        <div className="font-display text-2xl sm:text-4xl font-extrabold text-muted-foreground/40">
          VS
        </div>
        <Hand move={computer} side="right" shaking={shaking} reveal={!shaking && !!outcome} />
      </div>

      <div className="h-20 flex flex-col items-center justify-center">
        {shaking && (
          <p className="font-display text-xl sm:text-2xl text-muted-foreground animate-pulse">
            Rock... Paper... Scissors...
          </p>
        )}
        {!shaking && outcome && showResult && (
          <div className="flex flex-col items-center gap-1 animate-scale-in">
            <h2
              className="font-display text-3xl sm:text-5xl font-extrabold"
              style={{ color: `hsl(var(--${outcomeText[outcome].color}))` }}
            >
              {outcomeText[outcome].title}
            </h2>
            {player && computer && (
              <p className="text-sm text-muted-foreground">
                {MOVE_LABEL[player]} vs {MOVE_LABEL[computer]}
              </p>
            )}
          </div>
        )}
        {!shaking && !outcome && (
          <p className="font-display text-lg sm:text-xl text-muted-foreground">
            Choose your weapon
          </p>
        )}
      </div>
    </div>
  );
};