import { TITLE_SCENE } from "@/lib/story";
import { audio } from "@/lib/audio";

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const handleStart = () => {
    audio.resume();
    audio.sfx("transition");
    onStart();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div className="absolute inset-0 scene-enter">
        <div
          className="absolute inset-0 bg-cover bg-center ken-burns"
          style={{ backgroundImage: `url(${TITLE_SCENE.image})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" aria-hidden />
        <div className="absolute inset-0 vignette" aria-hidden />
        <div className="absolute inset-0 grain" aria-hidden />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="font-display italic tracking-[0.4em] text-xs md:text-sm uppercase text-primary text-rise">
          A Cinematic Experience
        </p>

        <h1 className="mt-6 font-display text-6xl md:text-8xl lg:text-9xl font-light leading-[0.95] text-foreground text-shadow-cinema text-rise">
          You Control<br />
          <span className="italic text-primary">the Story</span>
        </h1>

        <p className="mt-8 max-w-md text-lg md:text-xl text-muted-foreground font-display italic text-rise">
          Every choice changes everything.
        </p>

        <button
          onClick={handleStart}
          className="choice-rise mt-14 group relative px-12 py-5 rounded-sm bg-primary text-primary-foreground font-body text-sm tracking-[0.4em] uppercase hover:bg-primary/90 transition-all duration-500 hover:scale-105 pulse-ember active:scale-100 min-h-[56px]"
          style={{ animationDelay: "1.2s" }}
        >
          Begin
          <span className="ml-3 inline-block transition-transform group-hover:translate-x-1">→</span>
        </button>

        <p className="absolute bottom-8 text-xs tracking-[0.3em] uppercase text-muted-foreground/50">
          Headphones recommended
        </p>
      </div>
    </div>
  );
}
