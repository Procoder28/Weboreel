import { useEffect, useState } from "react";
import { BINGO_TILES } from "@/lib/generators";
import { sfx } from "@/lib/sound";
import { Card } from "@/components/ui/card";

export function StartupBingo() {
  const [tiles] = useState(() => {
    const shuffled = [...BINGO_TILES].sort(() => Math.random() - 0.5).slice(0, 25);
    shuffled[12] = "Free";
    return shuffled;
  });
  const [marked, setMarked] = useState<Set<number>>(() => new Set([12]));
  const [bingo, setBingo] = useState(false);

  const toggle = (i: number) => {
    if (i === 12) return;
    sfx.click();
    setMarked((m) => {
      const next = new Set(m);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  useEffect(() => {
    // detect any 5-in-a-row
    const lines: number[][] = [];
    for (let r = 0; r < 5; r++) lines.push([0,1,2,3,4].map(c => r*5 + c));
    for (let c = 0; c < 5; c++) lines.push([0,1,2,3,4].map(r => r*5 + c));
    lines.push([0, 6, 12, 18, 24]);
    lines.push([4, 8, 12, 16, 20]);
    const win = lines.some(line => line.every(idx => marked.has(idx)));
    if (win && !bingo) { setBingo(true); sfx.applause(); sfx.cash(); }
    if (!win && bingo) setBingo(false);
  }, [marked, bingo]);

  return (
    <Card className="overflow-hidden border-border bg-gradient-card p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Startup Bingo</h3>
          <p className="text-xs text-muted-foreground">Tap what you've witnessed this week</p>
        </div>
        {bingo && <span className="rounded-full bg-gradient-neon px-3 py-1 text-xs font-bold text-neon-foreground shadow-glow">BINGO! 🎉</span>}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {tiles.map((t, i) => {
          const isMarked = marked.has(i);
          const isFree = i === 12;
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`aspect-square rounded-md border p-1.5 text-[9px] font-semibold leading-tight transition-all sm:text-[10px] md:text-xs ${
                isMarked
                  ? "border-neon bg-gradient-neon text-neon-foreground shadow-glow"
                  : "border-border bg-card hover:border-neon/50 hover:bg-secondary"
              } ${isFree ? "italic" : ""}`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
