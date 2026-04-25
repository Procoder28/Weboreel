type Props = { onStart: () => void };

export function StartScreen({ onStart }: Props) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center scanlines">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_30%,oklch(0.85_0.18_155/0.12),transparent_60%)]" />

      <p className="font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground animate-fade-up">
        an experience
      </p>

      <h1
        className="mt-6 font-display text-5xl sm:text-7xl md:text-8xl font-bold leading-[0.95] text-foreground glitch animate-fade-up"
        data-text="Something is not right…"
        style={{ animationDelay: "0.1s" }}
      >
        Something is not right…
      </h1>

      <p
        className="mt-6 font-display text-xl sm:text-2xl text-muted-foreground animate-fade-up"
        style={{ animationDelay: "0.25s" }}
      >
        Can you adapt?
      </p>

      <button
        onClick={onStart}
        className="mt-14 rounded-full border border-primary/60 bg-primary/10 px-10 py-4 font-mono text-sm uppercase tracking-[0.4em] text-primary shadow-glow transition hover:bg-primary/20 hover:scale-[1.03] active:scale-[0.98] animate-fade-up"
        style={{ animationDelay: "0.4s" }}
      >
        Start
      </button>

      <p
        className="mt-16 max-w-md font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 animate-fade-up"
        style={{ animationDelay: "0.55s" }}
      >
        every click · every scroll · every swipe is reversed
      </p>
    </div>
  );
}
