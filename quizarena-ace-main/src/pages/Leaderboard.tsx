import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Trash2, Sparkles } from "lucide-react";
import { QuizLayout } from "@/components/QuizLayout";
import { clearLeaderboard, getLeaderboard } from "@/quiz/leaderboard";
import { CATEGORIES, LeaderboardEntry } from "@/quiz/types";

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  const reset = () => {
    if (confirm("Clear all leaderboard entries?")) {
      clearLeaderboard();
      setEntries([]);
    }
  };

  return (
    <QuizLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">Hall of Fame</p>
            <h1 className="text-4xl md:text-5xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground mt-2">Top 50 scores · stored locally on this device.</p>
          </div>
          <div className="flex gap-2">
            {entries.length > 0 && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm border border-border/60 hover:border-destructive/60 hover:text-destructive transition"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-5 h-10 rounded-full text-sm font-semibold shadow-glow hover:scale-[1.03] transition"
            >
              <Sparkles className="w-4 h-4" /> Play Again
            </Link>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-1">No scores yet</p>
            <p className="text-muted-foreground text-sm mb-6">Be the first to claim a top spot.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-6 h-11 rounded-full font-semibold shadow-glow"
            >
              Start a Quiz
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((e, i) => {
              const cat = CATEGORIES.find((c) => c.id === e.category);
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <motion.div
                  key={`${e.name}-${e.date}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass rounded-2xl px-5 py-4 flex items-center gap-4 ${
                    i < 3 ? "border-primary/40 shadow-glow" : ""
                  }`}
                >
                  <div className="w-10 text-center text-xl font-bold">
                    {medal ?? <span className="text-muted-foreground text-sm">#{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {cat?.emoji} {cat?.label} · {e.difficulty} · {e.accuracy}% acc · {new Date(e.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gradient">{e.score}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">pts</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </QuizLayout>
  );
};

export default Leaderboard;