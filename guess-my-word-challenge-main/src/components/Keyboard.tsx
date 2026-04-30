import { cn } from "@/lib/utils";
import type { LetterStatus } from "@/lib/wordleLogic";
import { Delete } from "lucide-react";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["ENTER", "z", "x", "c", "v", "b", "n", "m", "BACK"],
];

interface KeyboardProps {
  onKey: (key: string) => void;
  letterStatuses: Record<string, LetterStatus>;
}

const statusClass = (s?: LetterStatus) => {
  switch (s) {
    case "correct":
      return "bg-correct text-correct-foreground";
    case "present":
      return "bg-present text-present-foreground";
    case "absent":
      return "bg-absent text-absent-foreground";
    default:
      return "bg-key text-key-foreground";
  }
};

export const Keyboard = ({ onKey, letterStatuses }: KeyboardProps) => {
  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col gap-1.5 px-1 pb-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 sm:gap-1.5">
          {row.map((key) => {
            const isAction = key === "ENTER" || key === "BACK";
            const status = !isAction ? letterStatuses[key] : undefined;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onKey(key)}
                className={cn(
                  "flex h-12 select-none items-center justify-center rounded font-semibold uppercase transition-colors active:scale-95 sm:h-14",
                  isAction ? "px-2 text-xs sm:px-3 sm:text-sm" : "text-sm sm:text-base",
                  isAction ? "flex-[1.5] bg-key text-key-foreground" : "flex-1",
                  !isAction && statusClass(status)
                )}
                aria-label={key}
              >
                {key === "BACK" ? <Delete className="h-5 w-5" /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
