import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { questions, getResult, randomAdvice, type ResultTier } from "@/lib/quiz-data";
import {
  startMusic,
  sfxTap,
  sfxWhoosh,
  sfxSwell,
  sfxReveal,
} from "@/lib/audio";
import { Starfield, Particles } from "@/components/Atmosphere";
import { MuteToggle } from "@/components/MuteToggle";
import { Share2, RotateCcw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rate Your Existential Crisis — How deep are you, really?" },
      {
        name: "description",
        content:
          "Take the most honest 30-second quiz of your life. Find your existential crisis level and share it with the void.",
      },
      { property: "og:title", content: "Rate Your Existential Crisis" },
      {
        property: "og:description",
        content: "Be honest… it's just between you and the void.",
      },
    ],
  }),
  component: Index,
});

type Stage = "landing" | "quiz" | "analyzing" | "result";

function Index() {
  const [stage, setStage] = useState<Stage>("landing");
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  // Start music on first user gesture
  function begin() {
    startMusic();
    sfxWhoosh();
    setScore(0);
    setStep(0);
    setStage("quiz");
  }

  function answer(weight: number) {
    sfxTap();
    const next = score + weight;
    setScore(next);
    const nextStep = step + 1;
    if (nextStep >= questions.length) {
      sfxWhoosh();
      setStage("analyzing");
    } else {
      const q = questions[nextStep];
      if (q.vibe === "deep") setTimeout(sfxSwell, 250);
      else setTimeout(sfxWhoosh, 200);
      setStep(nextStep);
    }
  }

  function reset() {
    sfxTap();
    setStage("landing");
    setStep(0);
    setScore(0);
  }

  return (
    <main className="relative z-10 min-h-screen overflow-hidden">
      <Starfield />
      <MuteToggle />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
        {stage === "landing" && <Landing onStart={begin} />}
        {stage === "quiz" && <Quiz step={step} onAnswer={answer} />}
        {stage === "analyzing" && (
          <Analyzing onDone={() => { sfxReveal(); setStage("result"); }} />
        )}
        {stage === "result" && <Result score={score} onReset={reset} />}
      </div>
    </main>
  );
}

/* ---------------- Landing ---------------- */

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center animate-slide-up">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70">
        <Sparkles size={12} className="text-accent" />
        a quiz from the void
      </div>
      <h1 className="text-5xl sm:text-6xl font-bold leading-[1.05]">
        Rate Your <br />
        <span className="text-gradient">Existential</span> <br />
        Crisis
      </h1>
      <p className="mt-6 max-w-sm text-base text-foreground/70">
        Be honest… it's just between you and the void.
        <br />
        <span className="text-foreground/40">Takes about 30 seconds. Or a lifetime.</span>
      </p>

      <button
        onClick={onStart}
        className="group relative mt-10 inline-flex h-14 items-center justify-center rounded-full bg-neon-grad px-10 text-base font-semibold text-primary-foreground glow animate-pulse-glow transition-transform active:scale-95 hover:scale-[1.03]"
      >
        Start
        <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
      </button>

      <p className="mt-8 text-xs text-foreground/40">
        🎧 Best with headphones at 3AM
      </p>
    </div>
  );
}

/* ---------------- Quiz ---------------- */

function Quiz({ step, onAnswer }: { step: number; onAnswer: (w: number) => void }) {
  const q = questions[step];
  const pct = ((step + 1) / questions.length) * 100;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.2em] text-foreground/50">
          <span>question {step + 1} / {questions.length}</span>
          {q.vibe === "deep" && (
            <span className="text-accent animate-glitch">deep mode</span>
          )}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full bg-neon-grad transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div key={q.id} className="flex flex-1 flex-col animate-slide-up">
        <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">
          {q.text}
        </h2>

        <div className="mt-10 flex flex-col gap-3">
          {q.answers.map((a, i) => (
            <button
              key={a.text}
              onClick={() => onAnswer(a.weight)}
              style={{ animationDelay: `${i * 70}ms` }}
              className="group glass animate-slide-up flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:border-primary/60 hover:bg-primary/10 hover:shadow-[0_0_28px_oklch(0.72_0.22_305_/_0.35)] active:scale-[0.98]"
            >
              <span className="text-2xl transition-transform group-hover:scale-125">
                {a.emoji}
              </span>
              <span className="flex-1 text-base font-medium text-foreground/90">
                {a.text}
              </span>
              <span className="text-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-accent">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Analyzing ---------------- */

const phases = [
  "Analyzing your thoughts…",
  "Measuring existential weight…",
  "Consulting the void…",
];

function Analyzing({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const start = Date.now();
    const total = 2800;
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / total) * 100);
      setProgress(p);
      setPhase(Math.min(2, Math.floor((p / 100) * 3)));
      if (p >= 100 && !doneRef.current) {
        doneRef.current = true;
        clearInterval(id);
        onDone();
      }
    }, 60);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center">
      <Particles />
      <div className="relative">
        <div className="h-32 w-32 rounded-full bg-neon-grad blur-2xl opacity-50 animate-pulse-glow" />
        <div className="absolute inset-0 grid place-items-center text-5xl animate-glitch">
          🧠
        </div>
      </div>

      <p className="mt-10 text-lg font-medium text-foreground/90 animate-slide-up" key={phase}>
        {phases[phase]}
      </p>

      <div className="mt-6 h-1 w-64 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full bg-neon-grad transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------- Result ---------------- */

function Result({ score, onReset }: { score: number; onReset: () => void }) {
  const max = questions.reduce(
    (s, q) => s + Math.max(...q.answers.map((a) => a.weight)),
    0,
  );
  // add slight randomness for replayability (±4)
  const noise = useMemo(() => Math.floor(Math.random() * 9) - 4, []);
  const pctRaw = (score / max) * 100;
  const pct = Math.max(2, Math.min(99, Math.round(pctRaw + noise)));

  const result: ResultTier = useMemo(() => getResult(pct), [pct]);
  const advice = useMemo(() => randomAdvice(), []);

  // metric variations seeded by pct
  const overthink = Math.min(99, pct + Math.floor(Math.random() * 12));
  const sleep = Math.max(2, 100 - pct - Math.floor(Math.random() * 18));
  const clarity = Math.max(3, 100 - pct + Math.floor(Math.random() * 14) - 7);

  const [shared, setShared] = useState(false);
  async function share() {
    sfxTap();
    const text = `My Existential Crisis Level is ${pct}% ${result.emoji}\nI'm officially "${result.title}". What's yours?`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rate Your Existential Crisis", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShared(true);
        setTimeout(() => setShared(false), 2200);
      }
    } catch {
      /* user cancelled */
    }
  }

  // dynamic background overlay based on tier
  const bgOverlay =
    result.level === "Extreme"
      ? "bg-glitch"
      : result.level === "High"
        ? "bg-void"
        : "bg-cosmic";

  return (
    <div className="relative flex flex-1 flex-col">
      <div className={`pointer-events-none fixed inset-0 -z-10 opacity-60 ${bgOverlay}`} />

      <div className="flex flex-1 flex-col items-center justify-center text-center animate-pop">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
          Your Existential Crisis Level
        </p>

        <div className="relative mt-3">
          <div
            className={`text-[5rem] sm:text-[6.5rem] font-bold leading-none text-gradient ${
              result.level === "Extreme" ? "animate-glitch" : ""
            }`}
          >
            {pct}%
          </div>
          <div className="absolute -right-6 -top-2 text-4xl animate-drift">
            {result.emoji}
          </div>
        </div>

        <h2 className="mt-4 text-2xl font-semibold">
          {result.title} {result.emoji}
        </h2>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/75">
          {result.description}
        </p>

        {/* Metrics */}
        <div className="mt-8 grid w-full max-w-sm grid-cols-1 gap-3">
          <Metric label="Overthinking Index" value={overthink} color="primary" />
          <Metric label="Sleep Quality" value={sleep} color="accent" />
          <Metric label="Life Clarity" value={clarity} color="neon-pink" />
        </div>

        {/* Advice */}
        <div className="glass mt-6 rounded-2xl p-4 max-w-sm">
          <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
            advice from the void
          </p>
          <p className="mt-1 text-sm italic text-foreground/85">"{advice}"</p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <button
            onClick={share}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-neon-grad py-4 text-sm font-semibold text-primary-foreground glow transition-transform active:scale-95 hover:scale-[1.02]"
          >
            <Share2 size={16} />
            {shared ? "Copied to clipboard ✨" : "Share My Crisis"}
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-full glass py-4 text-sm font-medium text-foreground/85 transition-transform active:scale-95 hover:bg-foreground/10"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
        </div>

        <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-foreground/30">
          ⊹ certified by the void ⊹
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "primary" | "accent" | "neon-pink";
}) {
  const bg =
    color === "primary"
      ? "bg-primary"
      : color === "accent"
        ? "bg-accent"
        : "bg-[var(--neon-pink)]";
  return (
    <div className="glass rounded-xl px-4 py-3 text-left">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground/70">{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className={`h-full ${bg} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
