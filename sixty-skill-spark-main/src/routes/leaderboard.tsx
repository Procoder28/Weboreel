import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Particles } from "@/components/Particles";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, getStreak, getXP, levelFromXP } from "@/lib/session";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — 1-Minute Skill Test" },
      { name: "description", content: "Top scores across all players." },
    ],
  }),
  component: LeaderboardPage,
});

interface Row {
  session_id: string;
  best: number;
  attempts: number;
}

function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [you, setYou] = useState<{ rank: number | null; best: number; attempts: number } | null>(null);

  useEffect(() => {
    (async () => {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from("attempts")
        .select("session_id, score")
        .order("score", { ascending: false })
        .limit(1000);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // Aggregate by session_id: best score, total attempts
      const map = new Map<string, { best: number; attempts: number }>();
      for (const r of data ?? []) {
        const prev = map.get(r.session_id);
        if (!prev) map.set(r.session_id, { best: r.score, attempts: 1 });
        else {
          prev.attempts += 1;
          if (r.score > prev.best) prev.best = r.score;
        }
      }

      const sorted: Row[] = Array.from(map.entries())
        .map(([session_id, v]) => ({ session_id, best: v.best, attempts: v.attempts }))
        .sort((a, b) => b.best - a.best);

      setRows(sorted.slice(0, 25));

      const meIdx = sorted.findIndex((r) => r.session_id === sessionId);
      const me = meIdx >= 0 ? sorted[meIdx] : null;
      setYou({
        rank: meIdx >= 0 ? meIdx + 1 : null,
        best: me?.best ?? 0,
        attempts: me?.attempts ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  const xp = getXP();
  const level = levelFromXP(xp);
  const streak = getStreak();
  const sessionId = typeof window !== "undefined" ? getSessionId() : "";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>
      <Particles count={30} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full gradient-primary animate-pulse-glow" />
          <span className="text-sm font-semibold tracking-wide">SKILLTEST.AI</span>
        </Link>
        <Link
          to="/play"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
        >
          Play →
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-2xl px-4 pb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-4xl font-bold sm:text-5xl"
        >
          <span className="gradient-text">Leaderboard</span>
        </motion.h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Top players by best score
        </p>

        {/* You */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong mt-8 rounded-2xl p-5"
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Your stats
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <Mini label="Rank" value={you?.rank ? `#${you.rank}` : "—"} />
            <Mini label="Best" value={String(you?.best ?? 0)} />
            <Mini label="Streak" value={`${streak}🔥`} />
            <Mini label={level.name} value={`Lv ${level.level}`} />
          </div>
        </motion.div>

        {/* Top list */}
        <div className="mt-6 space-y-2">
          {loading && (
            <div className="glass rounded-xl p-4 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="glass rounded-xl p-6 text-center text-sm text-muted-foreground">
              No scores yet. Be the first!
            </div>
          )}
          {!loading &&
            rows.map((r, i) => {
              const isYou = r.session_id === sessionId;
              return (
                <motion.div
                  key={r.session_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                    isYou ? "glass-strong border-primary/50 glow-primary" : "glass"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        i === 0
                          ? "bg-warning/30 text-warning"
                          : i === 1
                            ? "bg-white/20"
                            : i === 2
                              ? "bg-accent/20 text-accent"
                              : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {isYou ? "You" : `Player ${r.session_id.slice(0, 6)}`}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.attempts} attempt{r.attempts === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold tabular-nums gradient-text">
                    {r.best}
                  </div>
                </motion.div>
              );
            })}
        </div>
      </section>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-bold">{value}</div>
    </div>
  );
}
