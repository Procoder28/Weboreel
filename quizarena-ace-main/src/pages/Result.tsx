import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home } from "lucide-react";
import { QuizLayout } from "@/components/QuizLayout";
import { QuizResult, CATEGORIES } from "@/quiz/types";
import { addEntry } from "@/quiz/leaderboard";

const Result = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: QuizResult | null };
  const saved = useRef(false);

  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
      return;
    }
    if (saved.current) return;
    saved.current = true;
    addEntry({
      name: state.playerName,
      score: state.score,
      date: new Date().toISOString(),
      category: state.category,
      difficulty: state.difficulty,
      accuracy: state.accuracy,
    });
  }, [state, navigate]);

  if (!state) return null;

  const cat = CATEGORIES.find((c) => c.id === state.category)!;
  const tier =
    state.accuracy >= 90 ? { label: "Legendary", color: "text-primary-glow" } :
    state.accuracy >= 70 ? { label: "Sharp Mind", color: "text-secondary" } :
    state.accuracy >= 40 ? { label: "Solid Effort", color: "text-success" } :
    { label: "Keep Training", color: "text-muted-foreground" };

  return (
    <QuizLayout>
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 mx-auto rounded-3xl bg-gradient-primary grid place-items-center shadow-glow animate-pulse-glow mb-6"
        >
          <Trophy className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        <p className={`text-sm uppercase tracking-[0.3em] mb-2 ${tier.color}`}>{tier.label}</p>
        <h1 className="text-5xl md:text-6xl font-bold mb-3">
          <span className="text-gradient">{state.score}</span> pts
        </h1>
        <p className="text-muted-foreground mb-10">
          {state.playerName} · {cat.emoji} {cat.label} · {state.difficulty}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-10">
          <Stat label="Correct" value={state.correct} accent="text-success" />
          <Stat label="Wrong" value={state.incorrect} accent="text-destructive" />
          <Stat label="Accuracy" value={`${state.accuracy}%`} accent="text-primary-glow" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() =>
              navigate("/play", {
                state: {
                  category: state.category,
                  difficulty: state.difficulty,
                  playerName: state.playerName,
                },
                replace: true,
              })
            }
            className="inline-flex items-center justify-center gap-2 bg-gradient-primary text-primary-foreground font-semibold px-6 h-12 rounded-full shadow-glow hover:scale-[1.03] transition"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
          <Link
            to="/leaderboard"
            className="inline-flex items-center justify-center gap-2 glass px-6 h-12 rounded-full font-medium hover:border-primary/60 transition"
          >
            <Trophy className="w-4 h-4" /> Leaderboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full font-medium text-muted-foreground hover:text-foreground transition"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </QuizLayout>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: string | number; accent: string }) => (
  <div className="glass rounded-2xl py-5">
    <div className={`text-3xl font-bold ${accent}`}>{value}</div>
    <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
  </div>
);

export default Result;