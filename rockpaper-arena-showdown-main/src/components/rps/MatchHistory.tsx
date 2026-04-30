import type { Round } from "./types";
import { MOVE_EMOJI, MOVE_LABEL } from "./logic";
import { cn } from "@/lib/utils";

const outcomeStyle: Record<Round["outcome"], string> = {
  win: "text-win border-win/40 bg-win/10",
  lose: "text-lose border-lose/40 bg-lose/10",
  draw: "text-draw border-draw/40 bg-draw/10",
};

const outcomeLabel: Record<Round["outcome"], string> = {
  win: "WIN",
  lose: "LOSS",
  draw: "DRAW",
};

export const MatchHistory = ({ rounds }: { rounds: Round[] }) => {
  return (
    <div className="arena-card rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold">Last 5 Rounds</h3>
        <span className="text-xs text-muted-foreground">{rounds.length}/5</span>
      </div>
      {rounds.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No rounds yet — pick a move to start.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rounds.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-secondary/40 border border-border animate-fade-in"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xl" aria-hidden>
                  {MOVE_EMOJI[r.player]}
                </span>
                <span className="text-muted-foreground">vs</span>
                <span className="text-xl" aria-hidden>
                  {MOVE_EMOJI[r.computer]}
                </span>
                <span className="ml-2 hidden sm:inline text-xs text-muted-foreground">
                  {MOVE_LABEL[r.player]} / {MOVE_LABEL[r.computer]}
                </span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border",
                  outcomeStyle[r.outcome],
                )}
              >
                {outcomeLabel[r.outcome]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};