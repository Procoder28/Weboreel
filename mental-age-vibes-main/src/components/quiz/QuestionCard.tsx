import { useEffect, useState } from "react";
import type { Question, Choice } from "@/lib/quiz-data";
import { sfxPop, sfxWhoosh, vibrate } from "@/lib/audio";

interface Props {
  question: Question;
  index: number;
  total: number;
  onAnswer: (choice: Choice) => void;
}

export function QuestionCard({ question, index, total, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setSelected(null);
    setExiting(false);
  }, [question.id]);

  const handlePick = (i: number, choice: Choice) => {
    if (selected !== null) return;
    setSelected(i);
    sfxPop();
    vibrate(15);
    window.setTimeout(() => {
      setExiting(true);
      sfxWhoosh();
    }, 380);
    window.setTimeout(() => {
      onAnswer(choice);
    }, 620);
  };

  const progress = ((index + (selected !== null ? 1 : 0)) / total) * 100;

  return (
    <div className="min-h-[100dvh] flex flex-col px-5 py-8 sm:py-12 max-w-xl mx-auto w-full">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-semibold text-foreground/70 mb-2">
          <span>
            Question {index + 1}/{total}
          </span>
          <span className="text-foreground/50">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/40">
          <div
            className="h-full gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        key={question.id}
        className={`flex-1 flex flex-col justify-center transition-all duration-300 ${
          exiting ? "opacity-0 -translate-x-8" : "animate-pop-in"
        }`}
      >
        {question.hint && (
          <p className="text-xs uppercase tracking-widest font-bold text-[var(--brand-purple)] mb-3">
            {question.hint}
          </p>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground mb-8">
          {question.prompt}
        </h2>

        <div className="grid gap-3">
          {question.choices.map((c, i) => {
            const isSelected = selected === i;
            const isDimmed = selected !== null && !isSelected;
            return (
              <button
                key={c.label}
                onClick={() => handlePick(i, c)}
                disabled={selected !== null}
                className={[
                  "press group relative text-left rounded-2xl px-5 py-4 font-semibold text-foreground",
                  "glass-card transition-all duration-300",
                  isSelected
                    ? "ring-2 ring-[var(--brand-purple)] shadow-glow scale-[1.02]"
                    : "hover:shadow-soft hover:-translate-y-0.5",
                  isDimmed ? "opacity-40" : "",
                ].join(" ")}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  {c.emoji && <span className="text-2xl">{c.emoji}</span>}
                  <span className="text-base sm:text-lg">{c.label}</span>
                </div>
                {isSelected && (
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--brand-purple)]/10 to-[var(--brand-pink)]/10 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}