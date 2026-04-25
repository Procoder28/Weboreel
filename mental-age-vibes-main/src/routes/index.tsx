import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/quiz/AnimatedBackground";
import { AudioToggle } from "@/components/quiz/AudioToggle";
import { Landing } from "@/components/quiz/Landing";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { Analyzing } from "@/components/quiz/Analyzing";
import { ResultScreen } from "@/components/quiz/ResultScreen";
import {
  QUESTIONS,
  calculateResult,
  type Choice,
  type Result,
} from "@/lib/quiz-data";
import { sfxChime, sfxFunny, startMusic, stopMusic } from "@/lib/audio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your Mental Age — A fun quiz that reads your vibe" },
      {
        name: "description",
        content:
          "Take the Mental Age quiz: 7 fun questions reveal whether you're a Wise Soul, Balanced Mind, Young Spirit, or Chaotic Energy.",
      },
      { property: "og:title", content: "What's Your Mental Age?" },
      {
        property: "og:description",
        content: "You might be younger… or way older than you think 👀",
      },
    ],
  }),
  component: Index,
});

type Stage = "landing" | "quiz" | "analyzing" | "result";

function Index() {
  const [stage, setStage] = useState<Stage>("landing");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Choice[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  // Music handling per stage
  useEffect(() => {
    if (stage === "quiz" || stage === "analyzing") {
      startMusic("quiz");
    } else if (stage === "result") {
      startMusic("reveal");
    } else {
      stopMusic();
    }
  }, [stage]);

  useEffect(() => () => stopMusic(), []);

  const handleStart = () => {
    setQIndex(0);
    setAnswers([]);
    setResult(null);
    setStage("quiz");
  };

  const handleAnswer = (choice: Choice) => {
    const next = [...answers, choice];
    setAnswers(next);
    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex(qIndex + 1);
    } else {
      setStage("analyzing");
      // compute result up-front so analyzing is purely cosmetic
      const r = calculateResult(next);
      setResult(r);
    }
  };

  const handleAnalyzed = () => {
    setStage("result");
    // celebratory sounds
    window.setTimeout(() => sfxChime(), 200);
    if (result && (result.type === "chaos" || result.age <= 18 || result.age >= 60)) {
      window.setTimeout(() => sfxFunny(), 900);
    }
  };

  const handleRestart = () => {
    setStage("landing");
    setAnswers([]);
    setResult(null);
    setQIndex(0);
  };

  const themeClass = stage === "result" && result ? result.themeClass : undefined;
  const glitch = stage === "result" && result?.type === "chaos";

  return (
    <main className="relative min-h-[100dvh]">
      <AnimatedBackground themeClass={themeClass} glitch={glitch} />
      <AudioToggle />

      {stage === "landing" && <Landing onStart={handleStart} />}

      {stage === "quiz" && (
        <QuestionCard
          question={QUESTIONS[qIndex]}
          index={qIndex}
          total={QUESTIONS.length}
          onAnswer={handleAnswer}
        />
      )}

      {stage === "analyzing" && <Analyzing onDone={handleAnalyzed} />}

      {stage === "result" && result && (
        <ResultScreen result={result} onRestart={handleRestart} />
      )}
    </main>
  );
}
