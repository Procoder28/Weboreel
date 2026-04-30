import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TypingArea } from "@/components/typerush/TypingArea";
import { StatTile } from "@/components/typerush/StatTile";
import { HistoryList } from "@/components/typerush/HistoryList";
import { ProgressChart } from "@/components/typerush/ProgressChart";
import { pickParagraph } from "@/lib/paragraphs";
import { Attempt, loadAttempts, saveAttempt, clearAttempts } from "@/lib/storage";
import { Keyboard, RotateCcw, Play, Trash2 } from "lucide-react";

type Phase = "idle" | "running" | "done";
const DURATIONS = [30, 60, 120] as const;

const Index = () => {
  const [duration, setDuration] = useState<number>(60);
  const [phase, setPhase] = useState<Phase>("idle");
  const [paragraph, setParagraph] = useState<string>(() => pickParagraph());
  const [input, setInput] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(60);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [focusKey, setFocusKey] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setAttempts(loadAttempts());
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Compute live stats
  const stats = useMemo(() => {
    let correct = 0;
    let mistakes = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === paragraph[i]) correct++;
      else mistakes++;
    }
    const charsTyped = input.length;
    const accuracy = charsTyped === 0 ? 100 : (correct / charsTyped) * 100;
    const elapsed =
      phase === "idle"
        ? 0
        : phase === "running"
        ? duration - remaining
        : duration;
    const minutes = Math.max(elapsed, 1) / 60;
    const wpm = Math.max(0, Math.round(correct / 5 / minutes));
    return { correct, mistakes, charsTyped, accuracy, wpm, elapsed };
  }, [input, paragraph, phase, duration, remaining]);

  // End conditions: timer ran out, or completed paragraph
  useEffect(() => {
    if (phase !== "running") return;
    if (remaining === 0 || input.length >= paragraph.length) {
      finalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, input, phase, paragraph]);

  const finalize = useCallback(() => {
    setPhase("done");
    const elapsed = startedAtRef.current
      ? Math.min(duration, Math.round((Date.now() - startedAtRef.current) / 1000))
      : duration;
    let correct = 0;
    let mistakes = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === paragraph[i]) correct++;
      else mistakes++;
    }
    const accuracy = input.length === 0 ? 0 : (correct / input.length) * 100;
    const minutes = Math.max(elapsed, 1) / 60;
    const wpm = Math.max(0, Math.round(correct / 5 / minutes));

    const attempt: Attempt = {
      id: crypto.randomUUID(),
      date: Date.now(),
      duration,
      wpm,
      accuracy: Math.round(accuracy * 10) / 10,
      mistakes,
      charsTyped: input.length,
    };
    setAttempts(saveAttempt(attempt));
  }, [duration, input, paragraph]);

  const startTest = useCallback(() => {
    setParagraph(pickParagraph(paragraph));
    setInput("");
    setRemaining(duration);
    startedAtRef.current = Date.now();
    setPhase("running");
    setFocusKey((k) => k + 1);
  }, [duration, paragraph]);

  const resetIdle = useCallback(() => {
    setPhase("idle");
    setInput("");
    setRemaining(duration);
    setParagraph(pickParagraph(paragraph));
  }, [duration, paragraph]);

  const handleInput = useCallback(
    (val: string) => {
      if (phase === "done") return;
      // Don't allow typing past paragraph
      if (val.length > paragraph.length) return;
      // Auto-start on first keystroke if idle
      if (phase === "idle" && val.length > 0) {
        startedAtRef.current = Date.now();
        setRemaining(duration);
        setPhase("running");
      }
      setInput(val);
    },
    [phase, paragraph.length, duration]
  );

  const onChooseDuration = (d: number) => {
    if (phase === "running") return;
    setDuration(d);
    setRemaining(d);
  };

  const lastAttempt = attempts[0];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Keyboard className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Type<span className="text-primary">Rush</span>
          </span>
        </div>
        <a
          href="#analytics"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Analytics
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* Hero / controls */}
        <section className="mb-8 animate-fade-in-up">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Test your typing speed.
            <span className="block text-primary">Track every keystroke.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Choose a duration, hit start, and type the paragraph as accurately as you can. We measure WPM, accuracy, and mistakes in real time.
          </p>
        </section>

        {/* Timer / Start row */}
        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-xl border border-border bg-card/60 p-1 shadow-card">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => onChooseDuration(d)}
                disabled={phase === "running"}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  duration === d
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={duration === d}
              >
                {d}s
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border bg-card/60 px-4 py-2 font-mono text-2xl tabular-nums shadow-card">
              {String(Math.floor(remaining / 60)).padStart(1, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </div>
            {phase === "idle" && (
              <Button size="lg" onClick={startTest} className="shadow-glow">
                <Play className="mr-2 h-4 w-4" />
                Start Test
              </Button>
            )}
            {phase === "running" && (
              <Button size="lg" variant="secondary" onClick={resetIdle}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart
              </Button>
            )}
            {phase === "done" && (
              <Button size="lg" onClick={startTest} className="shadow-glow">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </section>

        {/* Live stats */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="WPM" value={stats.wpm} accent />
          <StatTile label="Accuracy" value={`${stats.accuracy.toFixed(0)}%`} />
          <StatTile label="Mistakes" value={stats.mistakes} />
          <StatTile label="Typed" value={stats.charsTyped} hint="characters" />
        </section>

        {/* Typing area or End screen */}
        {phase !== "done" ? (
          <TypingArea
            text={paragraph}
            input={input}
            onChange={handleInput}
            disabled={false}
            focusKey={focusKey}
          />
        ) : (
          <div className="animate-fade-in-up rounded-2xl border border-border bg-card/70 p-8 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Test complete</h2>
              <span className="text-sm text-muted-foreground">
                {lastAttempt ? new Date(lastAttempt.date).toLocaleString() : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Final WPM" value={lastAttempt?.wpm ?? 0} accent />
              <StatTile label="Accuracy" value={`${lastAttempt?.accuracy ?? 0}%`} />
              <StatTile label="Characters" value={lastAttempt?.charsTyped ?? 0} />
              <StatTile label="Mistakes" value={lastAttempt?.mistakes ?? 0} />
            </div>
          </div>
        )}

        {/* Analytics */}
        <section id="analytics" className="mt-16 scroll-mt-20">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
              <p className="text-sm text-muted-foreground">Your last 5 attempts and WPM trend.</p>
            </div>
            {attempts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearAttempts();
                  setAttempts([]);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear history
              </Button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <HistoryList attempts={attempts} />
            </div>
            <div className="lg:col-span-3">
              <ProgressChart attempts={attempts} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Built for fast fingers · TypeRush
      </footer>
    </div>
  );
};

export default Index;
