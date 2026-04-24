import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

type Mode = "ambient" | "cinematic" | "off";

/**
 * Procedural ambient/cinematic music using WebAudio.
 * No external assets — generates dreamy pad chords + soft pulse.
 * Switches "mode" between landing/question (ambient) and result (cinematic).
 */
export function AmbientAudio({ mode }: { mode: Mode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);
  const [muted, setMuted] = useState(true); // start muted (autoplay policy)

  // Build / rebuild scene whenever mode changes
  useEffect(() => {
    if (muted || mode === "off") {
      nodesRef.current?.stop();
      nodesRef.current = null;
      return;
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(mode === "cinematic" ? 0.18 : 0.12, ctx.currentTime + 2);
    master.connect(ctx.destination);
    masterRef.current = master;

    // Reverb-ish via convolver-free: long-decay biquad lowpass + delay feedback
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.6;
    const fb = ctx.createGain();
    fb.gain.value = 0.45;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = mode === "cinematic" ? 1800 : 1200;
    delay.connect(fb).connect(lp).connect(delay);
    lp.connect(master);

    // Chord notes (Hz) — Amin9 dreamy for ambient, Cmaj9 for cinematic uplift
    const chord = mode === "cinematic"
      ? [130.81, 196.0, 246.94, 329.63, 392.0]
      : [110.0, 164.81, 220.0, 277.18, 329.63];

    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    chord.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      // very slow detune drift
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.02;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain).connect(o.detune);
      lfo.start();
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.06 / chord.length, ctx.currentTime + 3);
      o.connect(g);
      g.connect(lp);
      g.connect(master);
      o.start();
      oscs.push(o);
      gains.push(g);
    });

    nodesRef.current = {
      stop: () => {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.linearRampToValueAtTime(0, t + 0.6);
        setTimeout(() => {
          oscs.forEach((o) => { try { o.stop(); } catch {} });
        }, 700);
      },
    };

    return () => {
      nodesRef.current?.stop();
      nodesRef.current = null;
    };
  }, [mode, muted]);

  return (
    <button
      onClick={() => setMuted((m) => !m)}
      aria-label={muted ? "Unmute ambient music" : "Mute ambient music"}
      className="fixed bottom-4 right-4 z-50 rounded-full glass p-3 text-foreground/80 transition hover:text-foreground hover:scale-105"
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}