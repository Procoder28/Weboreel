import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Row = ({ word, highlight }: { word: string; highlight: { i: number; s: "correct" | "present" | "absent" } }) => {
  return (
    <div className="flex gap-1">
      {word.split("").map((c, i) => {
        const cls =
          i === highlight.i
            ? highlight.s === "correct"
              ? "bg-correct text-correct-foreground border-correct"
              : highlight.s === "present"
              ? "bg-present text-present-foreground border-present"
              : "bg-absent text-absent-foreground border-absent"
            : "bg-tile-empty border-tile-filled-border";
        return (
          <div
            key={i}
            className={`flex h-9 w-9 items-center justify-center border-2 text-base font-bold uppercase ${cls}`}
          >
            {c}
          </div>
        );
      })}
    </div>
  );
};

export const HelpDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>How to Play</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>Guess the 5-letter word in 6 tries.</p>
          <p>After each guess, the tile colors will show how close you were.</p>
          <div className="space-y-3 border-t border-border pt-3">
            <div>
              <Row word="apple" highlight={{ i: 0, s: "correct" }} />
              <p className="mt-1 text-xs text-muted-foreground">
                <b className="text-foreground">A</b> is in the word and in the right spot.
              </p>
            </div>
            <div>
              <Row word="brave" highlight={{ i: 1, s: "present" }} />
              <p className="mt-1 text-xs text-muted-foreground">
                <b className="text-foreground">R</b> is in the word but in the wrong spot.
              </p>
            </div>
            <div>
              <Row word="cloud" highlight={{ i: 3, s: "absent" }} />
              <p className="mt-1 text-xs text-muted-foreground">
                <b className="text-foreground">U</b> is not in the word.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
