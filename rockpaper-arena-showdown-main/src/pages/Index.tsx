import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Game } from "@/components/rps/Game";
import { Swords, Sparkles } from "lucide-react";

const Index = () => {
  const [started, setStarted] = useState(false);

  return (
    <main className="min-h-screen w-full px-4 py-8 sm:py-12">
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-8 sm:mb-12">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
            <Swords className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">
            RPS <span className="text-gradient">Arena</span>
          </span>
        </div>
        {started && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStarted(false)}
            className="text-muted-foreground"
          >
            ← Home
          </Button>
        )}
      </header>

      {!started ? (
        <section className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6 pt-8 sm:pt-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/40 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Classic game, neon energy
          </div>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-extrabold leading-[0.95]">
            Rock. Paper. <br />
            <span className="text-gradient">Scissors.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            Step into the arena and outwit the CPU. Track your wins, climb your
            streak, and try Best-of-5 mode for the real glory.
          </p>

          <div className="flex items-center gap-6 mt-2 text-5xl sm:text-6xl">
            <span className="animate-float">✊</span>
            <span className="animate-float" style={{ animationDelay: "0.2s" }}>
              ✋
            </span>
            <span className="animate-float" style={{ animationDelay: "0.4s" }}>
              ✌️
            </span>
          </div>

          <Button
            size="lg"
            onClick={() => setStarted(true)}
            className="mt-4 h-14 px-10 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 animate-pulse-glow"
          >
            Start Game
          </Button>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-md mt-6 text-xs text-muted-foreground">
            <div className="arena-card rounded-xl p-3">
              <div className="font-display font-bold text-foreground">Live</div>
              scoreboard
            </div>
            <div className="arena-card rounded-xl p-3">
              <div className="font-display font-bold text-foreground">Best</div>
              of 5 mode
            </div>
            <div className="arena-card rounded-xl p-3">
              <div className="font-display font-bold text-foreground">Saved</div>
              automatically
            </div>
          </div>
        </section>
      ) : (
        <section className="animate-fade-in">
          <Game />
        </section>
      )}

      <footer className="max-w-5xl mx-auto mt-16 text-center text-xs text-muted-foreground">
        Built for fun · Progress saved locally on your device
      </footer>
    </main>
  );
};

export default Index;
