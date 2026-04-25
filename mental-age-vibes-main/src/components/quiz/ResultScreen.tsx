import { useEffect, useState } from "react";
import { Share2, RotateCcw, Check } from "lucide-react";
import type { Result } from "@/lib/quiz-data";
import { StatBar } from "./StatBar";

interface Props {
  result: Result;
  onRestart: () => void;
}

export function ResultScreen({ result, onRestart }: Props) {
  const [displayAge, setDisplayAge] = useState(0);
  const [copied, setCopied] = useState(false);

  // Animate age count-up
  useEffect(() => {
    const target = result.age;
    const start = performance.now();
    const duration = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // ease-out
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayAge(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result.age]);

  const shareText = `My Mental Age is ${result.age} ${result.emoji} — ${result.title}. What's yours?`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    const data = { title: "Your Mental Age", text: shareText, url: shareUrl };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {/* Hero card */}
        <div className="relative rounded-3xl p-8 text-center text-white shadow-glow overflow-hidden animate-pop-in">
          <div className={`absolute inset-0 ${result.themeClass}`} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-widest text-white/80 mb-2">
              Your Mental Age is…
            </p>
            <div className="text-7xl sm:text-8xl font-extrabold tabular-nums leading-none drop-shadow-lg">
              {displayAge}
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur px-4 py-2 text-base font-bold">
              <span className="text-2xl">{result.emoji}</span>
              {result.title}
            </div>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-white/95">
              {result.description}
            </p>
          </div>
        </div>

        {/* Stats card */}
        <div className="mt-4 rounded-3xl p-6 text-white shadow-soft animate-pop-in" style={{ animationDelay: "120ms", background: "oklch(0.3 0.08 290 / 0.85)", backdropFilter: "blur(20px)" }}>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-4">
            Fun Stats
          </h3>
          <div className="space-y-4">
            <StatBar label="Maturity Level" value={result.maturity} delay={0} />
            <StatBar label="Overthinking Index" value={result.overthinking} delay={150} />
            <StatBar label="Chill Level" value={result.chill} delay={300} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3 animate-pop-in" style={{ animationDelay: "240ms" }}>
          <button
            onClick={handleShare}
            className="press inline-flex items-center justify-center gap-2 rounded-full gradient-primary px-5 py-3.5 font-bold text-primary-foreground shadow-soft hover:shadow-glow transition-shadow"
          >
            {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            {copied ? "Copied!" : "Share Result"}
          </button>
          <button
            onClick={onRestart}
            className="press inline-flex items-center justify-center gap-2 rounded-full glass-card px-5 py-3.5 font-bold text-foreground hover:bg-white/80 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            Try Again
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-foreground/50">
          Results vary slightly each time — your mind is not a spreadsheet.
        </p>
      </div>
    </div>
  );
}