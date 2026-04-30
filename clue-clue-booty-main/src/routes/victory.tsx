import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadState, resetState, type GameState } from "@/game/storage";
import { TOTAL_LEVELS } from "@/game/levels";
import treasureChest from "@/assets/treasure-chest.png";
import treasureBg from "@/assets/treasure-bg.jpg";

export const Route = createFileRoute("/victory")({
  head: () => ({
    meta: [
      { title: "Victory! — Treasure Hunt Quest" },
      { name: "description", content: "You solved every riddle and claimed the treasure. Behold your captain's certificate." },
    ],
  }),
  component: Victory,
});

function Victory() {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => { setState(loadState()); }, []);

  if (!state) return null;

  const totalSeconds = state.startedAt && state.finishedAt
    ? Math.floor((state.finishedAt - state.startedAt) / 1000) : 0;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  const rank =
    state.score >= 8500 ? "Legendary Captain" :
    state.score >= 6500 ? "Master Buccaneer" :
    state.score >= 4500 ? "Seasoned Sailor" : "Brave Deckhand";

  return (
    <main
      className="relative min-h-screen bg-gradient-parchment"
      style={{
        backgroundImage: `linear-gradient(oklch(0.92 0.04 75 / 0.85), oklch(0.86 0.06 70 / 0.92)), url(${treasureBg})`,
        backgroundSize: "cover",
      }}
    >
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <img
          src={treasureChest}
          alt="Treasure unlocked"
          width={260}
          height={260}
          className="mx-auto animate-float"
          loading="lazy"
        />

        <h1 className="mt-6 text-5xl font-bold text-primary md:text-7xl">
          <span className="text-gold">Victory!</span>
        </h1>
        <p className="mt-3 text-xl text-muted-foreground">
          The treasure of the Crimson Bay is yours.
        </p>

        {/* Certificate */}
        <div className="mt-10 rounded-2xl border-4 border-double border-gold/60 bg-card/95 p-8 shadow-treasure backdrop-blur-md md:p-12">
          <div className="text-xs font-bold uppercase tracking-[0.4em] text-accent">
            Certificate of Conquest
          </div>
          <div className="my-4 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

          <div className="text-2xl font-bold text-primary md:text-3xl">
            Be it known throughout the seven seas
          </div>
          <div className="mt-4 text-5xl font-bold text-gold md:text-6xl">
            {rank}
          </div>
          <p className="mt-4 text-foreground/80">
            has solved all {TOTAL_LEVELS} riddles of the Treasure Hunt Quest
            with cunning and grit.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <Stat label="Score" value={state.score.toLocaleString()} />
            <Stat label="Time" value={`${mins}m ${secs}s`} />
            <Stat label="Hints Saved" value={String(state.hintsRemaining)} />
          </div>

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div className="text-xs italic text-muted-foreground">
            Signed, Captain Lovable · {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="treasure" size="lg">
            <Link
              to="/"
              onClick={() => { resetState(); }}
            >
              Sail Again
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gradient-gold/20 p-4">
      <div className="text-2xl font-bold text-primary md:text-3xl">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
