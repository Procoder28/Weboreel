import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Timer as TimerIcon } from "lucide-react";
import { QuizLayout } from "@/components/QuizLayout";
import { getQuestions } from "@/quiz/questions";
import { Category, Difficulty, QuizResult } from "@/quiz/types";

const TIME_PER_Q = 30;

interface NavState {
  category: Category;
  difficulty: Difficulty;
  playerName: string;
}

const Play = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: NavState | null };

  useEffect(() => {
    if (!state) navigate("/", { replace: true });
  }, [state, navigate]);

  const questions = useMemo(
    () => (state ? getQuestions(state.category, state.difficulty) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state?.category, state?.difficulty]
  );

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);

  const current = questions[idx];

  // Timer
  useEffect(() => {
    if (locked || !current) return;
    if (timeLeft <= 0) {
      handleLock(null);
      return;
    }
    const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, locked, current]);

  const handleLock = (choice: number | null) => {
    if (locked || !current) return;
    setSelected(choice);
    setLocked(true);
    if (choice === current.answer) {
      setScore((s) => s + 10);
      setCorrect((c) => c + 1);
    } else {
      setScore((s) => s - 2);
      setIncorrect((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (!current) return;
    if (idx + 1 >= questions.length) {
      const finalCorrect = correct + (selected === current.answer ? 0 : 0); // already updated
      const total = questions.length;
      const accuracy = Math.round((correct / total) * 100);
      const result: QuizResult = {
        score,
        correct,
        incorrect,
        total,
        accuracy,
        category: state!.category,
        difficulty: state!.difficulty,
        playerName: state!.playerName,
      };
      navigate("/result", { state: result, replace: true });
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setLocked(false);
    setTimeLeft(TIME_PER_Q);
  };

  if (!state || !current) return null;

  const progress = ((idx) / questions.length) * 100;
  const timePct = (timeLeft / TIME_PER_Q) * 100;

  return (
    <QuizLayout>
      <div className="max-w-3xl mx-auto">
        {/* Top bar: progress + score */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-muted-foreground">
            Question <span className="text-foreground font-semibold">{idx + 1}</span> / {questions.length}
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-success font-semibold">
              <Check className="w-4 h-4" /> {correct}
            </span>
            <span className="flex items-center gap-1.5 text-destructive font-semibold">
              <X className="w-4 h-4" /> {incorrect}
            </span>
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary-glow font-bold">
              {score} pts
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 mb-8 mt-4">
          <TimerIcon className={`w-4 h-4 ${timeLeft <= 5 ? "text-destructive" : "text-muted-foreground"}`} />
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full ${timeLeft <= 5 ? "bg-destructive" : "bg-secondary"}`}
              animate={{ width: `${timePct}%` }}
              transition={{ duration: 0.4, ease: "linear" }}
            />
          </div>
          <span className={`text-sm font-mono w-8 text-right ${timeLeft <= 5 ? "text-destructive" : ""}`}>
            {timeLeft}s
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-3xl p-8 md:p-10 shadow-card mb-6"
          >
            <h2 className="text-2xl md:text-3xl font-semibold leading-snug mb-8">{current.q}</h2>
            <div className="grid gap-3">
              {current.options.map((opt, i) => {
                const isAnswer = locked && i === current.answer;
                const isWrongPick = locked && selected === i && i !== current.answer;
                const base = "text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-3";
                let cls = "border-border/60 hover:border-primary/60 hover:bg-primary/5";
                if (isAnswer) cls = "border-success/70 bg-success/10 text-success";
                else if (isWrongPick) cls = "border-destructive/70 bg-destructive/10 text-destructive";
                else if (locked) cls = "border-border/40 opacity-50";
                return (
                  <button
                    key={i}
                    onClick={() => handleLock(i)}
                    disabled={locked}
                    className={`${base} ${cls}`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-muted/60 grid place-items-center text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isAnswer && <Check className="w-5 h-5" />}
                    {isWrongPick && <X className="w-5 h-5" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!locked}
            className="bg-gradient-primary text-primary-foreground font-semibold px-8 h-12 rounded-full shadow-glow disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none hover:scale-[1.03] transition-transform"
          >
            {idx + 1 === questions.length ? "See Results" : "Next Question"}
          </button>
        </div>
      </div>
    </QuizLayout>
  );
};

export default Play;