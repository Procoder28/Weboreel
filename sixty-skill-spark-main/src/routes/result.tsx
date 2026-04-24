import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Particles } from "@/components/Particles";
import { Button } from "@/components/ui/button";
import { loadResult, type RoundResult } from "@/lib/round";
import { getXP, levelFromXP } from "@/lib/session";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Result — 1-Minute Skill Test" },
      { name: "description", content: "See how your answer scored." },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RoundResult | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) {
      navigate({ to: "/play" });
      return;
    }
    setData(r);
  }, [navigate]);

  if (!data) return null;

  const { challenge, evaluation, userAnswer, timeTakenMs, percentile, xpEarned, streak } = data;
  const seconds = (timeTakenMs / 1000).toFixed(1);
  const xp = getXP();
  const level = levelFromXP(xp);

  async function share() {
    const text = `I scored ${evaluation.score}/100 on a ${challenge.difficulty} 1-Minute Skill Test in ${seconds}s — beating ${percentile}% of players. Try it →`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: "1-Minute Skill Test", text, url });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareMsg("Copied to clipboard!");
      setTimeout(() => setShareMsg(null), 2200);
    } catch {
      setShareMsg("Could not share");
    }
  }

  const correct = evaluation.correct;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{
            background: correct ? "var(--success)" : "var(--destructive)",
            opacity: 0.25,
          }}
        />
      </div>
      <Particles count={40} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full gradient-primary animate-pulse-glow" />
          <span className="text-sm font-semibold tracking-wide">SKILLTEST.AI</span>
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 pb-16">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl ${
            correct ? "glow-success bg-success/20" : "glow-danger bg-destructive/20"
          }`}
        >
          {correct ? "✓" : "✗"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-4xl font-bold sm:text-5xl"
        >
          {correct ? "Correct!" : "Not quite"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 max-w-md text-balance text-center text-muted-foreground"
        >
          "{evaluation.feedback}"
        </motion.p>

        {/* Score grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid w-full grid-cols-3 gap-3"
        >
          <Stat label="Score" value={`${evaluation.score}`} suffix="/100" big />
          <Stat label="Time" value={seconds} suffix="s" />
          <Stat label="Percentile" value={`${percentile}`} suffix="%" />
        </motion.div>

        {/* Animated bars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="glass-strong mt-6 w-full rounded-2xl p-5"
        >
          <Bar label="Score" value={evaluation.score} max={100} color="var(--primary)" />
          <Bar
            label="AI Confidence"
            value={evaluation.confidence}
            max={100}
            color="var(--accent)"
            className="mt-4"
          />
          <Bar
            label="Beats players"
            value={percentile}
            max={100}
            color="var(--neon-blue)"
            className="mt-4"
          />
        </motion.div>

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass mt-4 w-full rounded-2xl p-5"
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Explanation
          </div>
          <p className="mt-2 text-sm leading-relaxed">{evaluation.explanation}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Your answer</div>
              <div className="mt-1 font-medium break-words">{userAnswer || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Correct answer</div>
              <div className="mt-1 font-medium break-words">{challenge.expected}</div>
            </div>
          </div>
        </motion.div>

        {/* XP / Streak / Level */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-4 grid w-full grid-cols-3 gap-3"
        >
          <Stat label="XP earned" value={`+${xpEarned}`} accent />
          <Stat label="Streak" value={`${streak}🔥`} />
          <Stat label={level.name} value={`Lv ${level.level}`} />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link to="/play">
            <Button variant="hero" size="hero">
              Retry Challenge →
            </Button>
          </Link>
          <Button variant="ghostGlass" size="hero" onClick={share}>
            {shareMsg ?? "Share Score"}
          </Button>
        </motion.div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  suffix,
  big,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  big?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-2xl px-3 py-4 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-bold ${big ? "text-3xl" : "text-xl"} ${
          accent ? "gradient-text" : ""
        }`}
      >
        {value}
        {suffix && <span className="ml-0.5 text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
  className = "",
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
    </div>
  );
}
