import { cn } from "@/lib/utils";
import type { LetterStatus } from "@/lib/wordleLogic";

interface TileProps {
  letter: string;
  status: LetterStatus;
  revealed: boolean;
  index: number;
  isWinRow?: boolean;
}

export const Tile = ({ letter, status, revealed, index, isWinRow }: TileProps) => {
  const hasLetter = letter !== "";

  const statusClass =
    revealed && status === "correct"
      ? "bg-correct text-correct-foreground border-correct"
      : revealed && status === "present"
      ? "bg-present text-present-foreground border-present"
      : revealed && status === "absent"
      ? "bg-absent text-absent-foreground border-absent"
      : hasLetter
      ? "bg-tile-empty border-tile-filled-border text-foreground"
      : "bg-tile-empty border-tile-empty-border text-foreground";

  return (
    <div
      className={cn(
        "flex aspect-square w-full items-center justify-center border-2 text-2xl font-bold uppercase sm:text-3xl",
        statusClass,
        hasLetter && !revealed && "animate-pop",
        revealed && "animate-flip",
        isWinRow && "animate-bounce-tile"
      )}
      style={{
        animationDelay: revealed
          ? `${index * 250}ms`
          : isWinRow
          ? `${index * 100}ms`
          : undefined,
      }}
    >
      {letter}
    </div>
  );
};
