import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
  onStart: () => void;
}

export function Landing({ onStart }: Props) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="animate-pop-in flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-sm font-semibold text-foreground/80 mb-6">
        <Sparkles className="h-4 w-4 text-[var(--brand-purple)]" />
        7 questions · ~1 minute
      </div>

      <h1 className="animate-pop-in text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
        What's Your <br />
        <span className="gradient-text">Mental Age?</span>
      </h1>

      <p className="mt-6 max-w-md text-base sm:text-lg text-foreground/70 animate-pop-in" style={{ animationDelay: "120ms" }}>
        You might be younger… or way older than you think 👀
      </p>

      <button
        onClick={onStart}
        className="press shadow-soft animate-bounce-slow mt-10 inline-flex items-center gap-2 rounded-full gradient-primary px-8 py-4 text-lg font-bold text-primary-foreground hover:shadow-glow transition-shadow"
      >
        Start Quiz
        <ArrowRight className="h-5 w-5" />
      </button>

      <p className="mt-6 text-xs text-foreground/50">No sign-up. Just vibes.</p>
    </div>
  );
}