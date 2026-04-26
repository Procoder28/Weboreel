import { useEffect, useRef, useState } from "react";
import {
  initAudio,
  startAmbient,
  startHeartbeat,
  setHeartbeatIntensity,
  stopHeartbeat,
  silence,
  playImpact,
  playClick,
} from "@/lib/audio";
import { rollOutcome, type Outcome } from "@/lib/outcomes";

type Phase = "intro" | "ready" | "blackout" | "processing" | "result";

const PROCESSING_LINES = [
  "Processing your choice…",
  "Evaluating outcome…",
  "There's no going back…",
];

export function OneChance() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [showSubtext, setShowSubtext] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [processingIdx, setProcessingIdx] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Intro timing
  useEffect(() => {
    const t1 = setTimeout(() => setShowSubtext(true), 1800);
    const t2 = setTimeout(() => {
      setShowButton(true);
      setPhase("ready");
    }, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // First user gesture starts audio
  const ensureAudio = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    await initAudio();
    startAmbient();
    startHeartbeat(58, 0.18);
  };

  // Hover intensifies heartbeat
  useEffect(() => {
    if (phase !== "ready") return;
    if (hovering) setHeartbeatIntensity(96, 0.32);
    else setHeartbeatIntensity(58, 0.18);
  }, [hovering, phase]);

  const handleClick = async () => {
    if (phase !== "ready") return;
    await ensureAudio();
    playClick();
    silence(); // sudden silence
    setPhase("blackout");

    setTimeout(() => {
      setPhase("processing");
      setProcessingIdx(0);
    }, 1100);
  };

  // Processing sequence
  useEffect(() => {
    if (phase !== "processing") return;
    if (processingIdx >= PROCESSING_LINES.length) {
      const o = rollOutcome();
      setOutcome(o);
      setTimeout(() => {
        setPhase("result");
        playImpact(o.kind);
      }, 800);
      return;
    }
    const t = setTimeout(() => setProcessingIdx((i) => i + 1), 1200);
    return () => clearTimeout(t);
  }, [phase, processingIdx]);

  const restart = () => {
    stopHeartbeat();
    silence();
    setOutcome(null);
    setShareMsg(null);
    setShowSubtext(false);
    setShowButton(false);
    setPhase("intro");
    startedRef.current = false;
    setTimeout(() => setShowSubtext(true), 1800);
    setTimeout(() => {
      setShowButton(true);
      setPhase("ready");
    }, 3200);
  };

  const share = async () => {
    if (!outcome) return;
    const text = `I had one chance…\nHere's what happened: "${outcome.text}" 😳`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "You Have One Chance", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareMsg("Copied to clipboard");
        setTimeout(() => setShareMsg(null), 2200);
      }
    } catch {
      /* user cancelled */
    }
  };

  const glowVar =
    outcome?.kind === "positive"
      ? "var(--color-glow-positive)"
      : outcome?.kind === "negative"
        ? "var(--color-glow-negative)"
        : outcome?.kind === "rare"
          ? "var(--color-glow-rare)"
          : "var(--color-glow-neutral)";

  return (
    <div className="vignette relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6">
      {/* Ambient background glow that shifts with phase / outcome */}
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-[2000ms] ease-out"
        style={{
          background:
            phase === "result"
              ? `radial-gradient(circle at 50% 45%, color-mix(in oklch, ${glowVar} 28%, transparent) 0%, transparent 55%)`
              : phase === "ready" && hovering
                ? "radial-gradient(circle at 50% 50%, oklch(0.7 0.18 250 / 0.18) 0%, transparent 60%)"
                : "radial-gradient(circle at 50% 50%, oklch(0.7 0.02 250 / 0.06) 0%, transparent 60%)",
        }}
      />
      {/* Subtle film grain via animated dots */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:3px_3px]" />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        {(phase === "intro" || phase === "ready") && (
          <>
            <h1 className="text-balance text-4xl font-light leading-tight tracking-tight sm:text-6xl animate-fade-up">
              You have one chance.
            </h1>

            <p
              className="mt-6 text-sm uppercase tracking-cinematic text-muted-foreground animate-fade-up"
              style={{ animationDelay: "0.2s", visibility: showSubtext ? "visible" : "hidden" }}
            >
              Make it count.
            </p>

            <div className="mt-16 h-32 flex items-center justify-center">
              {showButton && (
                <button
                  onMouseEnter={() => {
                    setHovering(true);
                    ensureAudio();
                  }}
                  onMouseLeave={() => setHovering(false)}
                  onTouchStart={() => {
                    setHovering(true);
                    ensureAudio();
                  }}
                  onClick={handleClick}
                  className={`group relative h-28 w-28 rounded-full border border-foreground/30 bg-background/40 text-sm uppercase tracking-cinematic text-foreground backdrop-blur-sm transition-all duration-300 hover:border-foreground/80 hover:text-foreground sm:h-32 sm:w-32 ${
                    hovering ? "animate-heartbeat-fast" : "animate-heartbeat"
                  }`}
                  style={{ cursor: "pointer" }}
                  aria-label="Click — you have one chance"
                >
                  <span className="relative z-10">Click</span>
                </button>
              )}
            </div>
          </>
        )}

        {phase === "blackout" && <div className="h-px w-px" />}

        {phase === "processing" && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6">
            {PROCESSING_LINES.slice(0, processingIdx + 1).map((line, i) => (
              <p
                key={i}
                className={`font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground sm:text-base ${
                  i === processingIdx ? "animate-flicker" : ""
                }`}
                style={{ animation: `fade-in 0.6s ease-out forwards` }}
              >
                {line}
              </p>
            ))}
          </div>
        )}

        {phase === "result" && outcome && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-10">
            <div
              className="absolute h-72 w-72 rounded-full blur-3xl animate-reveal-glow"
              style={{ background: glowVar, opacity: 0.25 }}
            />

            <p
              className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              {outcome.kind === "rare" ? "// rare ending //" : "// outcome //"}
            </p>

            <h2
              className={`text-balance text-3xl font-light leading-tight tracking-tight sm:text-5xl animate-fade-up ${
                outcome.kind === "negative" ? "animate-glitch" : ""
              }`}
              style={{ animationDelay: "0.6s" }}
            >
              {outcome.text}
            </h2>

            {outcome.subtitle && (
              <p
                className="max-w-md text-base text-muted-foreground animate-fade-up"
                style={{ animationDelay: "1.2s" }}
              >
                {outcome.subtitle}
              </p>
            )}

            <div
              className="animate-fade-up rounded-full border border-foreground/20 px-4 py-1.5 text-[10px] uppercase tracking-[0.4em] text-foreground/80"
              style={{ animationDelay: "1.6s", borderColor: `color-mix(in oklch, ${glowVar} 50%, transparent)` }}
            >
              Your type: {outcome.tag}
            </div>

            <div
              className="mt-4 flex flex-col items-center gap-3 animate-fade-up sm:flex-row sm:gap-4"
              style={{ animationDelay: "2s" }}
            >
              <button
                onClick={share}
                className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-cinematic text-background transition-transform hover:scale-[1.03]"
                style={{ cursor: "pointer" }}
              >
                Share my outcome
              </button>
              <button
                onClick={restart}
                className="rounded-full border border-foreground/30 px-6 py-3 text-xs uppercase tracking-cinematic text-foreground/80 transition-colors hover:border-foreground/70 hover:text-foreground"
                style={{ cursor: "pointer" }}
              >
                Let others try
              </button>
            </div>

            {shareMsg && (
              <p className="text-xs uppercase tracking-cinematic text-muted-foreground animate-fade-in">
                {shareMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer mark */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60">
        one click · one outcome
      </div>
    </div>
  );
}
