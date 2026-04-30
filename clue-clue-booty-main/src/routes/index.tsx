import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import treasureChest from "@/assets/treasure-chest.png";
import treasureBg from "@/assets/treasure-bg.jpg";
import { Button } from "@/components/ui/button";
import { loadState, resetState, type GameState } from "@/game/storage";
import { TOTAL_LEVELS } from "@/game/levels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Treasure Hunt Quest — Solve Riddles, Claim the Gold" },
      { name: "description", content: "A swashbuckling 10-level riddle adventure. Solve pirate puzzles, race the clock, and claim your captain's certificate." },
      { property: "og:title", content: "Treasure Hunt Quest" },
      { property: "og:description", content: "Solve 10 pirate riddles and earn your captain's badge." },
    ],
  }),
  component: Home,
});

function Home() {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const hasProgress = state && state.completedLevels.length > 0 && !state.finishedAt;
  const continueLevel = state?.currentLevel ?? 1;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gradient-parchment"
      style={{
        backgroundImage: `linear-gradient(oklch(0.92 0.04 75 / 0.85), oklch(0.86 0.06 70 / 0.92)), url(${treasureBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <img
          src={treasureChest}
          alt="Glowing treasure chest"
          width={320}
          height={320}
          className="animate-float drop-shadow-2xl"
          style={{ filter: "drop-shadow(0 20px 30px oklch(0.35 0.15 50 / 0.4))" }}
        />

        <h1 className="mt-6 text-5xl font-bold text-primary md:text-7xl lg:text-8xl">
          Treasure Hunt <span className="text-gold">Quest</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground md:text-xl">
          Ahoy, brave soul! Solve {TOTAL_LEVELS} riddles whispered by ancient pirates.
          The faster ye answer, the richer the bounty.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          {hasProgress ? (
            <>
              <Button asChild size="lg" variant="treasure">
                <Link to="/play/$level" params={{ level: String(continueLevel) }}>
                  Continue — Level {continueLevel}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  resetState();
                  setState(loadState());
                }}
              >
                Start Over
              </Button>
            </>
          ) : (
            <Button asChild size="lg" variant="treasure">
              <Link to="/play/$level" params={{ level: "1" }}>
                Begin the Hunt
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "10 Riddles", desc: "Cunning pirate puzzles" },
            { label: "Race the Clock", desc: "Faster = more gold" },
            { label: "Earn the Badge", desc: "Captain's certificate" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-xl border border-border/50 bg-card/70 p-5 backdrop-blur-sm shadow-treasure"
            >
              <div className="text-2xl font-bold text-primary">{f.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
