import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { StarField } from "@/components/StarField";
import { QuestionCard } from "@/components/QuestionCard";
import { AnalyzingScreen } from "@/components/AnalyzingScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { AmbientAudio } from "@/components/AmbientAudio";
import { generateFuture, type FutureResult } from "@/server/generateFuture";

export const Route = createFileRoute("/")({
  component: Index,
});

type Phase = "landing" | "q1" | "q2" | "q3" | "loading" | "result" | "error";

const Q1 = {
  question: "What best describes your approach to money?",
  subtitle: "Money mindset shapes your runway.",
  options: [
    { label: "Save and invest carefully", value: "saver", emoji: "🏦" },
    { label: "Spend and enjoy life", value: "spender", emoji: "✨" },
    { label: "Still figuring it out", value: "unsure", emoji: "🌫️" },
    { label: "Dream big, risk big", value: "risktaker", emoji: "🎲" },
  ],
};
const Q2 = {
  question: "What do you want most in your career?",
  subtitle: "Where your ambition points, your decade follows.",
  options: [
    { label: "Stability and comfort", value: "stability", emoji: "🛡️" },
    { label: "High success and recognition", value: "success", emoji: "🏆" },
    { label: "Freedom and flexibility", value: "freedom", emoji: "🕊️" },
    { label: "Passion and creativity", value: "passion", emoji: "🎨" },
  ],
};
const Q3 = {
  question: "What are your daily habits like?",
  subtitle: "Habits compound. So does their absence.",
  options: [
    { label: "Disciplined and consistent", value: "disciplined", emoji: "⚡" },
    { label: "On and off motivation", value: "wavering", emoji: "🌊" },
    { label: "Chaotic but trying", value: "chaotic", emoji: "🌀" },
    { label: "I'll start tomorrow 😅", value: "procrastinator", emoji: "🛌" },
  ],
};

function Index() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [answers, setAnswers] = useState<{ money?: string; career?: string; habits?: string }>({});
  const [result, setResult] = useState<FutureResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runAi = useCallback(async (a: { money: string; career: string; habits: string }) => {
    setPhase("loading");
    setProgress(0);
    setError(null);

    // Animated progress until AI returns
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(92, p + (Math.random() * 6 + 2));
      setProgress(p);
    }, 220);

    try {
      const res = await generateFuture({ data: a });
      clearInterval(tick);
      setProgress(100);
      setTimeout(() => {
        setResult(res);
        setPhase("result");
      }, 500);
    } catch (e: any) {
      clearInterval(tick);
      setError(e?.message ?? "Something went wrong");
      setPhase("error");
    }
  }, []);

  const handleAnswer = (key: "money" | "career" | "habits", value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (key === "money") setPhase("q2");
    else if (key === "career") setPhase("q3");
    else if (key === "habits" && next.money && next.career) {
      runAi({ money: next.money, career: next.career, habits: value });
    }
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
    setPhase("landing");
  };

  const audioMode = phase === "result" ? "cinematic" : phase === "loading" ? "off" : "ambient";

  return (
    <main className="relative min-h-[100svh] w-full overflow-hidden">
      {/* Global starfield (hidden once result has its own backdrop) */}
      {phase !== "result" && (
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-cosmic" />
          <StarField />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.3_0.18_300/0.25)_0%,transparent_60%)]" />
        </div>
      )}

      <AmbientAudio mode={audioMode} />

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 py-10 sm:py-16">
        {phase === "landing" && <Landing onStart={() => setPhase("q1")} />}
        {phase === "q1" && (
          <QuestionCard
            step={1} total={3}
            {...Q1}
            onAnswer={(v) => handleAnswer("money", v)}
          />
        )}
        {phase === "q2" && (
          <QuestionCard
            step={2} total={3}
            {...Q2}
            onAnswer={(v) => handleAnswer("career", v)}
          />
        )}
        {phase === "q3" && (
          <QuestionCard
            step={3} total={3}
            {...Q3}
            onAnswer={(v) => handleAnswer("habits", v)}
          />
        )}
        {phase === "loading" && <AnalyzingScreen progress={progress} />}
        {phase === "result" && result && (
          <ResultScreen result={result} onRetry={reset} />
        )}
        {phase === "error" && (
          <div className="glass rounded-3xl p-8 max-w-md text-center animate-fade-up">
            <p className="text-foreground mb-4">{error}</p>
            <button
              onClick={reset}
              className="rounded-2xl bg-aurora px-6 py-3 font-semibold text-primary-foreground glow-violet"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative w-full max-w-2xl text-center animate-fade-in-slow">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-xs uppercase tracking-[0.3em] text-secondary">
        <Sparkles className="h-3 w-3" />
        AI Future Simulator
      </div>

      <h1 className="text-5xl sm:text-7xl font-bold leading-[1.02] mb-6">
        What will <br />
        <span className="text-gradient">your life</span> look like
        <br /> in <span className="text-gradient">10 years</span>?
      </h1>

      <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-md mx-auto">
        Answer 3 questions. Let AI predict your future — in cinematic detail.
      </p>

      <button
        onClick={onStart}
        className="group relative inline-flex items-center gap-3 rounded-full bg-aurora px-8 py-4 sm:px-10 sm:py-5 text-lg font-semibold text-primary-foreground transition hover:scale-105 animate-pulse-glow"
      >
        Start Your Journey
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>

      <p className="mt-8 text-xs text-muted-foreground/60 font-display tracking-[0.2em] uppercase">
        Takes 30 seconds · Powered by AI
      </p>
    </div>
  );
}
