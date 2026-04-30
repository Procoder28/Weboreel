import { Link, useLocation } from "react-router-dom";
import { Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const QuizLayout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">QuizMaster</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Arena</div>
            </div>
          </Link>
          <Link
            to="/leaderboard"
            className={`inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium border border-border/60 hover:border-primary/60 hover:text-primary-glow transition ${
              pathname === "/leaderboard" ? "bg-primary/10 text-primary-glow border-primary/40" : ""
            }`}
          >
            <Trophy className="w-4 h-4" /> Leaderboard
          </Link>
        </div>
      </header>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 container py-10"
      >
        {children}
      </motion.main>
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        Built for thinkers · QuizMaster Arena
      </footer>
    </div>
  );
};