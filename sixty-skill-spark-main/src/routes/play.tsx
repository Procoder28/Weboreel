import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CountdownRing } from "@/components/CountdownRing";
import { Particles } from "@/components/Particles";
import { Button } from "@/components/ui/button";
import { generateChallenge, evaluateAnswer } from "@/server/challenges.functions";
import { recordAttempt } from "@/server/attempts.functions";
import { sfx, isMuted, setMuted } from "@/lib/sound";
import { getSessionId, getStreak, setStreak, addXP } from "@/lib/session";
import { saveResult } from "@/lib/round";
import type { Challenge, Difficulty } from "@/lib/types";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — 1-Minute Skill Test" },
      { name: "description", content: "Solve an AI-generated puzzle in 60 seconds." },
    ],
  }),
  component: PlayPage,
});

const TOTAL_SECONDS = 60;

type Phase = "select" | "loading" | "playing" | "submitting";

function PlayPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("select");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);

  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        const next = +(r - 0.1).toFixed(1);
        // Tick sounds: only on whole seconds, urgency in last 10s
        if (Math.abs(next - Math.round(next)) < 0.05) {
          if (next <= 10 && next > 0) sfx.urgent();
          else if (next > 0 && next % 5 === 0) sfx.tick();
        }
        if (next <= 0) {
          window.clearInterval(id);
          handleSubmit(true);
          return 0;
        }
        return next;
      });
    }, 100);
    tickRef.current = id;
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function startChallenge(d: Difficulty) {
    setDifficulty(d);
    setError(null);
    setPhase("loading");
    setAnswer("");
    submittedRef.current = false;
    try {
      const c = await generateChallenge({ data: { difficulty: d } });
      setChallenge(c as Challenge);
      setRemaining(TOTAL_SECONDS);
      startedAtRef.current = performance.now();
      setPhase("playing");
      sfx.start();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to load challenge");
      setPhase("select");
    }
  }

  async function handleSubmit(autoSubmitted = false) {
    if (submittedRef.current || !challenge) return;
    submittedRef.current = true;
    if (tickRef.current) window.clearInterval(tickRef.current);
    const timeTakenMs = Math.round(performance.now() - startedAtRef.current);
    setPhase("submitting");
    if (!autoSubmitted) sfx.submit();

    try {
      const evalRes = await evaluateAnswer({
        data: {
          challenge: {
            type: challenge.type,
            difficulty: challenge.difficulty,
            prompt: challenge.prompt,
            expected: challenge.expected ?? "",
          },
          userAnswer: answer,
          timeTakenMs,
        },
      });

      // Record + percentile
      const sessionId = getSessionId();
      const rec = await recordAttempt({
        data: {
          sessionId,
          difficulty: challenge.difficulty,
          challengeType: challenge.type,
          challengePrompt: challenge.prompt,
          userAnswer: answer,
          correct: evalRes.correct,
          score: evalRes.score,
          timeTakenMs,
        },
      });

      // XP + streak
      const xpEarned = Math.round(evalRes.score * (difficulty === "hard" ? 2 : difficulty === "medium" ? 1.5 : 1));
      addXP(xpEarned);
      const newStreak = evalRes.correct ? getStreak() + 1 : 0;
      setStreak(newStreak);

      if (evalRes.correct) sfx.success();
      else sfx.fail();

      saveResult({
        challenge,
        evaluation: evalRes,
        userAnswer: answer,
        timeTakenMs,
        difficulty: challenge.difficulty,
        percentile: rec.percentile,
        totalAttempts: rec.totalAttempts,
        xpEarned,
        streak: newStreak,
      });

      navigate({ to: "/result" });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to evaluate");
      setPhase("playing");
      submittedRef.current = false;
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/20 blur-[120px]" />
      </div>
      <Particles count={35} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full gradient-primary animate-pulse-glow" />
          <span className="text-sm font-semibold tracking-wide">SKILLTEST.AI</span>
        </Link>
        <button
          onClick={toggleMute}
          className="glass rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇 Muted" : "🔊 Sound"}
        </button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {phase === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="glass-strong w-full rounded-3xl p-8 sm:p-10"
            >
              <h1 className="text-3xl font-bold sm:text-4xl">Choose your difficulty</h1>
              <p className="mt-2 text-muted-foreground">A fresh AI puzzle. 60 seconds. Go.</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <motion.button
                    key={d}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => startChallenge(d)}
                    className="glass group rounded-2xl p-5 text-left transition hover:border-primary/40"
                  >
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {d === "easy" ? "Warmup" : d === "medium" ? "Standard" : "Brutal"}
                    </div>
                    <div className="mt-1 text-xl font-semibold capitalize">{d}</div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {d === "easy" && "1× XP · Friendly"}
                      {d === "medium" && "1.5× XP · Brain on"}
                      {d === "hard" && "2× XP · Experts only"}
                    </div>
                  </motion.button>
                ))}
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                Crafting your challenge…
              </p>
            </motion.div>
          )}

          {phase === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                AI is judging your answer…
              </p>
            </motion.div>
          )}

          {phase === "playing" && challenge && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-full"
            >
              <div className="mb-6 flex items-center justify-between">
                <CountdownRing remaining={remaining} total={TOTAL_SECONDS} size={100} />
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {challenge.type === "mcq"
                      ? "Multiple choice"
                      : challenge.type === "code-output"
                        ? "Code output"
                        : challenge.type === "logic"
                          ? "Logic"
                          : "Short answer"}
                  </div>
                  <div className="mt-1 text-xs font-medium text-primary capitalize">
                    {challenge.difficulty}
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-3xl p-6 sm:p-8">
                <p className="whitespace-pre-wrap text-balance text-lg leading-relaxed sm:text-xl">
                  {challenge.prompt}
                </p>

                <div className="mt-8">
                  {challenge.type === "mcq" && challenge.options ? (
                    <div className="grid gap-2">
                      {challenge.options.map((opt) => {
                        const selected = answer === opt;
                        return (
                          <motion.button
                            key={opt}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setAnswer(opt)}
                            className={`rounded-xl border px-4 py-3 text-left transition ${
                              selected
                                ? "border-primary bg-primary/15 glow-primary"
                                : "border-white/10 bg-white/5 hover:border-primary/40"
                            }`}
                          >
                            {opt}
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : challenge.type === "code-output" ? (
                    <input
                      autoFocus
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="What does it print?"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-base outline-none focus:border-primary"
                    />
                  ) : (
                    <input
                      autoFocus
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="Type your answer…"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none focus:border-primary"
                    />
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    Press Enter or hit Submit
                  </span>
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={!answer}
                    variant="hero"
                    size="xl"
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
