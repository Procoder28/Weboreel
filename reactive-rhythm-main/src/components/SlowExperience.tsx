import { useEffect, useState } from "react";
import { Intro } from "./Intro";
import { Whisper } from "./Whisper";
import { Section } from "./Section";
import { CursorGlow } from "./CursorGlow";
import { BehaviorHUD } from "./BehaviorHUD";
import { Ending } from "./Ending";
import { DodgeButton } from "./DodgeButton";
import { behavior } from "@/lib/behavior";
import { audio } from "@/lib/audio-engine";
import { useBehavior } from "@/hooks/use-behavior";

export function SlowExperience() {
  const [started, setStarted] = useState(false);
  const [showEnding, setShowEnding] = useState(false);
  const [returning, setReturning] = useState(false);
  const s = useBehavior();

  // Detect returning visitor
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "slow-down-visits";
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev > 0) setReturning(true);
    localStorage.setItem(key, String(prev + 1));
  }, []);

  // Mood on body
  useEffect(() => {
    document.body.dataset.mood = s.mood;
    audio.setMood(s.mood);
  }, [s.mood]);

  // SFX reactions
  useEffect(() => {
    if (!started) return;
    if (s.scrollSpeed > 2600) audio.warningTone();
  }, [s.scrollSpeed > 2600, started]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase escalation effects
  useEffect(() => {
    if (s.phase >= 4) audio.glitchBurst();
  }, [s.phase]);

  // Patience reward — hidden chime + message
  useEffect(() => {
    if (!started) return;
    if (s.idleMs > 4500 && s.idleMs < 5200 && s.phase <= 2) {
      audio.chime();
      behavior.setMessage("You waited. Good.");
    }
  }, [s.idleMs, s.phase, started]);

  // Forced pause at phase 5
  const [forcedPause, setForcedPause] = useState(false);
  useEffect(() => {
    if (s.phase === 5 && !forcedPause) {
      setForcedPause(true);
      audio.duck(0.08, 2.4);
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => {
        document.body.style.overflow = "";
        setForcedPause(false);
      }, 2600);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [s.phase, forcedPause]);

  const onEnter = async () => {
    await audio.start();
    behavior.start();
    if (returning) {
      setTimeout(() => behavior.setMessage("You rushed last time too."), 1800);
    }
    setStarted(true);
  };

  return (
    <div className="scanlines vignette relative min-h-screen">
      <CursorGlow />

      {!started && <Intro onEnter={onEnter} />}

      {started && (
        <>
          <Whisper />
          <BehaviorHUD />

          {forcedPause && (
            <div className="fixed inset-0 z-[55] flex items-center justify-center bg-background/90 backdrop-blur-xl">
              <div className="text-center">
                <div className="mb-3 text-xs uppercase tracking-[0.4em] text-muted-foreground breathing">
                  Loading…
                </div>
                <div
                  className="text-3xl font-light md:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span className="glitch-text" data-text="Breathe.">
                    Breathe.
                  </span>
                </div>
              </div>
            </div>
          )}

          <main className="relative">
            {/* Hero */}
            <section className="relative mx-auto flex min-h-[90vh] max-w-3xl flex-col items-start justify-end px-6 pb-24 pt-40">
              <div className="mb-6 text-[10px] uppercase tracking-[0.5em] text-muted-foreground breathing">
                Scene 01 · Arrival
              </div>
              <h1
                className="text-balance text-5xl font-light leading-[1.02] md:text-8xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                This website is paying attention.
              </h1>
              <p className="mt-8 max-w-xl text-lg text-muted-foreground md:text-xl">
                Every scroll, every click, every pause. The longer you stay,
                the more it shows you. Rush, and it starts to push back.
              </p>
            </section>

            <Section id="noise" eyebrow="Scene 02 · Noise" title="You live in fast.">
              <p>
                Feeds move. Notifications pile. Your thumb learned to flick
                before your eyes learned to read. You didn't choose this pace —
                it was handed to you.
              </p>
              <p>
                So here's a small rebellion. A page that refuses to be skimmed.
              </p>
            </Section>

            <Section
              id="mirror"
              eyebrow="Scene 03 · Mirror"
              title="A page that reads you back."
            >
              <p>
                Most sites treat you like a pair of eyeballs to be captured.
                This one treats you like a person being watched — and it's
                honest about it.
              </p>
              <p>
                If you move fast, the music tightens. If you wait, something
                quiet arrives. Hidden things only appear to people who stay.
              </p>
            </Section>

            <Section
              id="secret"
              eyebrow="Scene 04 · Reward"
              title="Stay a moment. Something appears."
              hideable
            >
              <p>
                Stop scrolling. Breathe in. Count to five. If you really wait,
                you'll hear a chime and read this sentence:
              </p>
              <p className="italic text-accent">
                "The quickest way to miss your life is to rush through it."
              </p>
              <p className="text-sm text-muted-foreground">
                Patient visitors see this. Impatient ones see a blank frame.
              </p>
            </Section>

            <Section
              id="confession"
              eyebrow="Scene 05 · Confession"
              title="Why are you in such a hurry?"
              hideable
            >
              <p>
                There's no news here. Nothing to buy. No next video queued.
                Just a page and you, and the small discomfort of being seen.
              </p>
              <p>
                Most people close the tab at this point. The ones who stay
                usually learn something about themselves.
              </p>
            </Section>

            <Section
              id="truth"
              eyebrow="Scene 06 · Truth"
              title="The experience adapts to you."
            >
              <p>
                Behind this text, a small state machine is watching your scroll
                speed, click rhythm, hover time, and idle pauses. Five phases.
                Three moods. Your mood is currently <em>{s.mood}</em>.
              </p>
              <p>
                Go slower and everything softens. Go faster and it sharpens its
                teeth.
              </p>
            </Section>

            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                When you're ready
              </p>
              <DodgeButton onClick={() => setShowEnding(true)}>
                See what it thinks of you
              </DodgeButton>
            </div>

            {showEnding && <Ending onRestart={() => window.location.reload()} />}
          </main>
        </>
      )}
    </div>
  );
}
