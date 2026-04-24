import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Typewriter } from "./Typewriter";
import { Particles } from "./Particles";
import { Repeat, Share2, Dice5, Music, Quote } from "lucide-react";
import { playBoom, playSparkle, playWhoosh } from "@/lib/sfx";
import type { MovieData } from "@/lib/movie-types";

interface Props {
  movie: MovieData;
  heroName: string;
  onRemake: () => void;
  onRandom: () => void;
}

const SONG_VIBES: Record<string, { emoji: string; color: string }> = {
  Romantic: { emoji: "💞", color: "oklch(0.7 0.18 0)" },
  Sad: { emoji: "🥀", color: "oklch(0.55 0.12 270)" },
  Party: { emoji: "🎉", color: "oklch(0.78 0.2 50)" },
  Motivational: { emoji: "🔥", color: "oklch(0.85 0.17 85)" },
  Action: { emoji: "💥", color: "oklch(0.6 0.24 25)" },
};

export function MovieReveal({ movie, heroName, onRemake, onRandom }: Props) {
  const [phase, setPhase] = useState(0); // 0=title, 1=poster, 2=story, 3=dialogue, 4=full
  const [storyDone, setStoryDone] = useState(false);

  useEffect(() => {
    playBoom();
    const t1 = setTimeout(() => { playSparkle(); setPhase(1); }, 2200);
    const t2 = setTimeout(() => { playWhoosh(); setPhase(2); }, 4200);
    const t3 = setTimeout(() => setPhase(3), 6200);
    const t4 = setTimeout(() => setPhase(4), 9000);
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, []);

  const songVibe = SONG_VIBES[movie.songVibe] || SONG_VIBES.Motivational;

  const shareText = `🎬 My life as a Bollywood movie: "${movie.title}" — ${movie.tagline}\n\n"${movie.dialogue}"\n\nGet yours →`;

  const shareWhatsapp = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`,
      "_blank",
    );
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: movie.title, text: shareText, url });
        return;
      } catch { /* fallback */ }
    }
    shareWhatsapp();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Particles count={50} />

      {/* PHASE 0 — TITLE EXPLOSION */}
      {phase === 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background animate-fade-in">
          <div className="text-center px-6">
            <div className="font-display tracking-[0.5em] text-gold/60 uppercase text-xs mb-6 animate-fade-up">
              A {movie.yearReleased} Production
            </div>
            <h1
              className="font-display gradient-gold-text glow-gold-lg animate-title-reveal animate-shake"
              style={{
                fontSize: "clamp(2.5rem, 9vw, 7rem)",
                lineHeight: 1.05,
                letterSpacing: "0.02em",
              }}
            >
              {movie.title}
            </h1>
            <p
              className="mt-6 text-foreground/80 font-serif italic text-lg md:text-2xl animate-fade-up"
              style={{ animationDelay: "1s", opacity: 0 }}
            >
              {movie.tagline}
            </p>
          </div>
        </div>
      )}

      {/* PHASE 1+ — POSTER / DETAILS */}
      {phase >= 1 && (
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-10">
          {/* POSTER */}
          <div className="poster-frame rounded-3xl p-8 md:p-12 text-center relative overflow-hidden animate-fade-up">
            <div
              className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-30"
              style={{ background: songVibe.color }}
            />
            <div className="relative">
              <p className="font-display tracking-[0.4em] uppercase text-gold/70 text-[10px] md:text-xs">
                {movie.yearReleased} • {movie.genre}
              </p>
              <h1
                className="font-display gradient-gold-text glow-gold mt-4"
                style={{
                  fontSize: "clamp(2rem, 7vw, 5rem)",
                  lineHeight: 1.05,
                }}
              >
                {movie.title}
              </h1>
              <p className="mt-4 text-foreground/75 font-serif italic text-base md:text-xl">
                {movie.tagline}
              </p>

              <div className="mt-8 pt-6 border-t border-gold/20">
                <p className="font-display tracking-[0.3em] uppercase text-gold/60 text-[10px] md:text-xs mb-3">
                  Starring
                </p>
                <p className="font-display gradient-gold-text text-2xl md:text-4xl glow-gold">
                  {heroName}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm md:text-base text-muted-foreground font-serif">
                  {movie.cast.slice(1).map((c, i) => (
                    <span key={i}>
                      {c}
                      {i < movie.cast.length - 2 && <span className="ml-3 text-gold/40">•</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STORYLINE */}
          {phase >= 2 && (
            <div className="glass-card rounded-2xl p-6 md:p-10 animate-fade-up">
              <p className="font-display tracking-[0.3em] uppercase text-gold/70 text-xs mb-4">
                The Story
              </p>
              <div className="font-serif text-lg md:text-2xl leading-relaxed text-foreground/90 min-h-[6rem]">
                {phase === 2 || (phase >= 2 && !storyDone) ? (
                  <Typewriter
                    text={movie.storyline}
                    speed={22}
                    onDone={() => setStoryDone(true)}
                  />
                ) : (
                  movie.storyline
                )}
              </div>
            </div>
          )}

          {/* DIALOGUE */}
          {phase >= 3 && (
            <div className="text-center py-8 animate-fade-up">
              <Quote className="mx-auto h-8 w-8 text-gold/60 mb-4" />
              <p className="font-display gradient-gold-text glow-gold text-2xl md:text-4xl italic leading-snug max-w-3xl mx-auto px-4">
                "{movie.dialogue}"
              </p>
            </div>
          )}

          {/* SONG + ACTIONS */}
          {phase >= 4 && (
            <>
              <div
                className="glass-card rounded-2xl p-6 md:p-8 flex items-center justify-between gap-4 animate-fade-up"
                style={{ borderColor: songVibe.color, boxShadow: `0 0 40px ${songVibe.color}40` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center text-2xl shrink-0"
                    style={{ background: songVibe.color, boxShadow: `0 0 30px ${songVibe.color}` }}
                  >
                    {songVibe.emoji}
                  </div>
                  <div>
                    <p className="font-display tracking-[0.2em] uppercase text-gold/70 text-[10px] md:text-xs">
                      Song Vibe
                    </p>
                    <p className="font-display text-xl md:text-2xl text-foreground">
                      {movie.songVibe}
                    </p>
                  </div>
                </div>
                <Music className="h-6 w-6 text-gold/60 shrink-0" />
              </div>

              <p
                className="text-center font-serif italic text-lg md:text-xl text-gold/70 pt-6 animate-fade-up"
              >
                Every life is a story worth watching.
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-4 animate-fade-up">
                <Button
                  onClick={share}
                  className="bg-gold text-primary-foreground hover:bg-gold/90 font-display uppercase tracking-wider rounded-full h-12 px-6"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share My Movie
                </Button>
                <Button
                  onClick={onRemake}
                  variant="outline"
                  className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold font-display uppercase tracking-wider rounded-full h-12 px-6"
                >
                  <Repeat className="mr-2 h-4 w-4" /> Remake
                </Button>
                <Button
                  onClick={onRandom}
                  variant="outline"
                  className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold font-display uppercase tracking-wider rounded-full h-12 px-6"
                >
                  <Dice5 className="mr-2 h-4 w-4" /> Random Story
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
