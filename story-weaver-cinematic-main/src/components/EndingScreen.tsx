import { useEffect } from "react";
import { STORY, type Scene } from "@/lib/story";
import { audio } from "@/lib/audio";

type Props = {
  scene: Scene;
  history: string[];
  onRestart: () => void;
};

export function EndingScreen({ scene, history, onRestart }: Props) {
  useEffect(() => {
    audio.playMood(scene.mood === "hope" ? "hope" : scene.mood);
  }, [scene.mood]);

  if (!scene.ending) return null;
  const { kind, title, epitaph } = scene.ending;

  const accent =
    kind === "good" ? "text-primary"
    : kind === "twist" ? "text-accent"
    : "text-destructive";

  const pathLabels = history
    .map((id) => {
      const s = STORY[id];
      return s?.chapter;
    })
    .filter(Boolean);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div className="absolute inset-0 scene-enter">
        <div
          className="absolute inset-0 bg-cover bg-center ken-burns"
          style={{ backgroundImage: `url(${scene.image})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" aria-hidden />
        <div className="absolute inset-0 vignette" aria-hidden />
        <div className="absolute inset-0 grain" aria-hidden />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className={`font-display italic tracking-[0.4em] text-xs md:text-sm uppercase ${accent} text-rise`}>
          {kind === "good" ? "An ending" : kind === "twist" ? "A twist" : "A bad end"}
        </p>

        <h1 className="mt-6 font-display text-5xl md:text-7xl lg:text-8xl font-light leading-[1] text-foreground text-shadow-cinema text-rise max-w-4xl">
          {title}
        </h1>

        <p className="mt-8 max-w-xl text-lg md:text-2xl text-muted-foreground font-display italic text-rise">
          {epitaph}
        </p>

        {/* Path summary */}
        <div className="mt-12 max-w-md w-full text-rise" style={{ animationDelay: "0.6s" }}>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground/60 mb-3">Your path</p>
          <div className="space-y-1">
            {Array.from(new Set(pathLabels)).map((label, i) => (
              <p key={`${label}-${i}`} className="font-display text-sm md:text-base text-muted-foreground/80">
                {label}
              </p>
            ))}
          </div>
        </div>

        <div className="choice-rise mt-12 flex flex-col sm:flex-row gap-3" style={{ animationDelay: "1s" }}>
          <button
            onClick={() => { audio.sfx("click"); onRestart(); }}
            className="px-10 py-4 rounded-sm bg-primary text-primary-foreground font-body text-sm tracking-[0.3em] uppercase hover:bg-primary/90 transition-all hover:scale-105 active:scale-100 min-h-[52px]"
          >
            Restart Story
          </button>
          <button
            onClick={() => { audio.sfx("click"); onRestart(); }}
            className="px-10 py-4 rounded-sm border border-primary/40 text-foreground font-body text-sm tracking-[0.3em] uppercase hover:border-primary hover:bg-primary/10 transition-all hover:scale-105 active:scale-100 min-h-[52px]"
          >
            Try Different Choices
          </button>
        </div>
      </div>
    </div>
  );
}
