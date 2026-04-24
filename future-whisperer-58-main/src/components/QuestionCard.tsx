import { useState } from "react";
import { Sparkles } from "lucide-react";

export type Option = { label: string; value: string; emoji?: string };

export function QuestionCard({
  step,
  total,
  question,
  subtitle,
  options,
  onAnswer,
}: {
  step: number;
  total: number;
  question: string;
  subtitle?: string;
  options: Option[];
  onAnswer: (value: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  const handle = (v: string) => {
    if (picked) return;
    setPicked(v);
    // tactile feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.(15); } catch {}
    }
    setTimeout(() => onAnswer(v), 380);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto animate-fade-up">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-aurora transition-all duration-700 ease-out"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display">
          {step}/{total}
        </span>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-10">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.25em] text-secondary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Question {step}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold leading-tight mb-2">
          {question}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
        )}

        <div className="grid gap-3 mt-6">
          {options.map((opt, i) => {
            const isPicked = picked === opt.value;
            const isFaded = picked && !isPicked;
            return (
              <button
                key={opt.value}
                onClick={() => handle(opt.value)}
                disabled={!!picked}
                style={{ animationDelay: `${i * 80}ms` }}
                className={[
                  "group relative text-left rounded-2xl px-5 py-4 sm:px-6 sm:py-5",
                  "border border-white/10 bg-white/[0.03]",
                  "transition-all duration-300 ease-out animate-fade-up",
                  "hover:border-primary/60 hover:bg-white/[0.06] hover:translate-x-1",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isPicked && "border-primary/80 bg-primary/10 glow-violet scale-[1.02]",
                  isFaded && "opacity-30",
                ].filter(Boolean).join(" ")}
              >
                <div className="flex items-center gap-3">
                  {opt.emoji && (
                    <span className="text-xl shrink-0">{opt.emoji}</span>
                  )}
                  <span className="text-base sm:text-lg font-medium">{opt.label}</span>
                </div>
                <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/5 to-secondary/5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}