import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Timer, Trophy, Zap } from "lucide-react";
import { QuizLayout } from "@/components/QuizLayout";
import { CATEGORIES, DIFFICULTIES, Category, Difficulty } from "@/quiz/types";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const ready = name.trim().length > 0 && category && difficulty;

  const start = () => {
    if (!ready) return;
    navigate("/play", { state: { category, difficulty, playerName: name.trim() } });
  };

  return (
    <QuizLayout>
      <section className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs uppercase tracking-[0.2em] text-primary-glow mb-6"
        >
          <Zap className="w-3.5 h-3.5" /> 10 Questions · 30s each
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
          Enter the <span className="text-gradient">Arena</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Pick a category, choose your difficulty, and battle the clock. Climb the leaderboard with every right answer.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-primary-glow" /> 5 categories</span>
          <span className="flex items-center gap-2"><Timer className="w-4 h-4 text-secondary" /> 30s timer</span>
          <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-success" /> Local leaderboard</span>
        </div>
      </section>

      <section className="max-w-5xl mx-auto space-y-12">
        <div>
          <SectionLabel index={1} title="Your name" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="w-full glass rounded-2xl px-5 h-14 text-lg outline-none focus:border-primary/60 focus:shadow-glow transition"
            maxLength={20}
          />
        </div>

        <div>
          <SectionLabel index={2} title="Pick a category" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((c, i) => (
              <motion.button
                key={c.id}
                onClick={() => setCategory(c.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group text-left p-5 rounded-2xl glass hover:border-primary/60 transition-all ${
                  category === c.id ? "border-primary/70 shadow-glow bg-primary/5" : ""
                }`}
              >
                <div className="text-3xl mb-3 group-hover:animate-float">{c.emoji}</div>
                <div className="font-semibold">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.blurb}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel index={3} title="Choose difficulty" />
          <div className="grid md:grid-cols-3 gap-4">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`p-5 rounded-2xl glass text-left hover:border-secondary/60 transition ${
                  difficulty === d.id ? "border-secondary/70 bg-secondary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">{d.label}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.multiplier}</span>
                </div>
                <div className="text-sm text-muted-foreground">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4">
          <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition">
            View leaderboard →
          </Link>
          <button
            onClick={start}
            disabled={!ready}
            className="group inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground font-semibold px-8 h-14 rounded-full shadow-glow disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none hover:scale-[1.03] transition-transform"
          >
            Start Quiz
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </section>
    </QuizLayout>
  );
};

const SectionLabel = ({ index, title }: { index: number; title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="w-7 h-7 rounded-full bg-primary/15 text-primary-glow grid place-items-center text-xs font-bold">
      {index}
    </span>
    <h2 className="text-xl font-semibold">{title}</h2>
  </div>
);

export default Index;
