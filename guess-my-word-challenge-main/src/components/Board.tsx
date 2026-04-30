import { Tile } from "./Tile";
import type { LetterStatus } from "@/lib/wordleLogic";
import { cn } from "@/lib/utils";

interface BoardProps {
  guesses: string[];
  statuses: LetterStatus[][];
  currentGuess: string;
  currentRow: number;
  shakeRow: boolean;
  won: boolean;
}

export const Board = ({
  guesses,
  statuses,
  currentGuess,
  currentRow,
  shakeRow,
  won,
}: BoardProps) => {
  return (
    <div className="mx-auto grid max-w-[330px] grid-rows-6 gap-1.5 px-2">
      {Array.from({ length: 6 }).map((_, rowIdx) => {
        const isCurrent = rowIdx === currentRow;
        const guess = isCurrent ? currentGuess.padEnd(5, " ") : (guesses[rowIdx] ?? "     ");
        const rowStatuses = statuses[rowIdx] ?? Array(5).fill("empty");
        const revealed = rowIdx < currentRow;
        const isWinRow = won && rowIdx === currentRow - 1;

        return (
          <div
            key={rowIdx}
            className={cn("grid grid-cols-5 gap-1.5", isCurrent && shakeRow && "animate-shake")}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const ch = guess[i] === " " ? "" : guess[i];
              return (
                <Tile
                  key={i}
                  letter={ch ?? ""}
                  status={rowStatuses[i] as LetterStatus}
                  revealed={revealed}
                  index={i}
                  isWinRow={isWinRow}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
