import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Stats } from "@/lib/wordleLogic";

interface StatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: Stats;
  result?: { won: boolean; answer: string } | null;
  onPlayAgain?: () => void;
  canPlayAgain?: boolean;
}

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex flex-col items-center">
    <div className="text-3xl font-bold tabular-nums">{value}</div>
    <div className="mt-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
  </div>
);

export const StatsDialog = ({
  open,
  onOpenChange,
  stats,
  result,
  onPlayAgain,
  canPlayAgain,
}: StatsDialogProps) => {
  const winPct = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
  const maxDist = Math.max(1, ...stats.guessDistribution);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl tracking-wide">
            {result ? (result.won ? "You Won! 🎉" : "Better luck next time") : "Statistics"}
          </DialogTitle>
          {result && (
            <DialogDescription className="text-center">
              The word was{" "}
              <span className="font-bold uppercase tracking-widest text-foreground">
                {result.answer}
              </span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 py-2">
          <Stat label="Played" value={stats.played} />
          <Stat label="Win %" value={winPct} />
          <Stat label="Streak" value={stats.currentStreak} />
          <Stat label="Best" value={stats.bestStreak} />
        </div>

        <div>
          <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Guess Distribution
          </h3>
          <div className="flex flex-col gap-1">
            {stats.guessDistribution.map((count, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 text-sm font-bold">{i + 1}</div>
                <div className="flex-1">
                  <div
                    className="flex h-5 items-center justify-end rounded-sm bg-absent px-2 text-xs font-bold text-absent-foreground"
                    style={{ width: `${Math.max(8, (count / maxDist) * 100)}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {canPlayAgain && onPlayAgain && (
          <Button onClick={onPlayAgain} className="mt-2 w-full">
            Play Again
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
