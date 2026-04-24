import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Film } from "lucide-react";
import { CinematicBackground } from "@/components/CinematicBackground";
import { MovieForm } from "@/components/MovieForm";
import { MovieReveal } from "@/components/MovieReveal";
import { GeneratingScreen } from "@/components/GeneratingScreen";
import { generateMovie } from "@/server/movie.functions";
import type { MovieData, MovieFormData } from "@/lib/movie-types";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { playBoom, playWhoosh } from "@/lib/sfx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your Life as a Bollywood Movie — AI Cinematic Reel" },
      {
        name: "description",
        content:
          "Turn your story into a Bollywood blockbuster. AI generates a movie title, storyline, cast and iconic dialogue starring you.",
      },
      { property: "og:title", content: "Your Life as a Bollywood Movie" },
      {
        property: "og:description",
        content: "Let AI turn your life into a cinematic Bollywood blockbuster.",
      },
    ],
  }),
  component: Index,
});

type Stage = "hero" | "form" | "loading" | "reveal";

const RANDOM_PRESETS: MovieFormData[] = [
  {
    name: "Aarav",
    personality: "ambitious",
    goal: "Become India's top cricketer",
    struggle: "Father wants me to join the family business",
    loveLife: "in love",
    dramaLevel: 9,
  },
  {
    name: "Zoya",
    personality: "chaotic",
    goal: "Open a cafe in the mountains",
    struggle: "Stuck in a corporate job in Mumbai",
    loveLife: "it's complicated",
    dramaLevel: 8,
  },
  {
    name: "Vikram",
    personality: "romantic",
    goal: "Find true love before turning 30",
    struggle: "Always falls for the wrong people",
    loveLife: "heartbroken",
    dramaLevel: 10,
  },
];

function Index() {
  const [stage, setStage] = useState<Stage>("hero");
  const [movie, setMovie] = useState<MovieData | null>(null);
  const [heroName, setHeroName] = useState("");

  const start = () => {
    playBoom();
    setStage("form");
  };

  const handleSubmit = async (data: MovieFormData) => {
    setHeroName(data.name);
    setStage("loading");
    try {
      const res = await generateMovie({ data });
      if ("error" in res) {
        toast.error(res.error);
        setStage("form");
        return;
      }
      setMovie(res.movie);
      playWhoosh();
      setStage("reveal");
    } catch (err) {
      console.error(err);
      toast.error("Kuch toh gadbad hai. Try again.");
      setStage("form");
    }
  };

  const handleRandom = () => {
    const preset = RANDOM_PRESETS[Math.floor(Math.random() * RANDOM_PRESETS.length)];
    handleSubmit(preset);
  };

  const handleRemake = () => {
    playWhoosh();
    setMovie(null);
    setStage("form");
  };

  return (
    <>
      <CinematicBackground />
      <Toaster
        theme="dark"
        toastOptions={{
          className: "glass-card font-display",
        }}
      />

      <main className="relative min-h-screen w-full">
        {stage === "hero" && (
          <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
                <Film className="h-4 w-4 text-gold" />
                <span className="font-display tracking-[0.3em] uppercase text-xs text-gold/90">
                  Cinematic AI Experience
                </span>
              </div>
            </div>

            <h1
              className="font-display gradient-gold-text glow-gold-lg animate-title-reveal max-w-5xl"
              style={{
                fontSize: "clamp(2.25rem, 7vw, 5.5rem)",
                lineHeight: 1.05,
                letterSpacing: "0.01em",
              }}
            >
              What If Your Life Was a Bollywood Movie?
            </h1>

            <p
              className="mt-8 max-w-xl text-lg md:text-2xl text-foreground/80 font-serif italic animate-fade-up opacity-0"
              style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
            >
              Let AI turn your story into a blockbuster.
            </p>

            <div
              className="mt-12 animate-fade-up opacity-0"
              style={{ animationDelay: "1.4s", animationFillMode: "forwards" }}
            >
              <Button
                onClick={start}
                size="lg"
                className="bg-gold text-primary-foreground hover:bg-gold/90 font-display tracking-[0.2em] uppercase rounded-full h-14 px-10 text-base animate-pulse-glow"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate My Movie
              </Button>
            </div>

            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-display tracking-[0.4em] uppercase animate-fade-in opacity-0"
              style={{ animationDelay: "2s", animationFillMode: "forwards" }}
            >
              Scroll the spotlight ↓
            </div>
          </section>
        )}

        {stage === "form" && (
          <section className="relative min-h-screen flex items-center justify-center">
            <MovieForm onComplete={handleSubmit} />
          </section>
        )}

        {stage === "loading" && <GeneratingScreen />}

        {stage === "reveal" && movie && (
          <MovieReveal
            movie={movie}
            heroName={heroName}
            onRemake={handleRemake}
            onRandom={handleRandom}
          />
        )}
      </main>
    </>
  );
}
