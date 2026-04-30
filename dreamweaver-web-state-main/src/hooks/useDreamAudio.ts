import { useEffect, useRef } from "react";
import type { DreamPhase } from "./useIdleDream";

/**
 * Web Audio synthesis — no external assets.
 * Active = stable warm pad. Dream = detuned drifting drone with slow tremolo.
 * Crossfades smoothly via gain ramps.
 */
export function useDreamAudio(phase: DreamPhase, enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodes = useRef<{
    activeGain?: GainNode;
    dreamGain?: GainNode;
    masterGain?: GainNode;
  }>({});

  useEffect(() => {
    if (!enabled) return;
    if (ctxRef.current) return;

    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);

    // ---- ACTIVE LAYER: gentle two-osc pad ----
    const activeGain = ctx.createGain();
    activeGain.gain.value = 0.0;
    const activeFilter = ctx.createBiquadFilter();
    activeFilter.type = "lowpass";
    activeFilter.frequency.value = 1200;
    activeGain.connect(activeFilter).connect(master);

    [110, 164.81, 220].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 1 ? "triangle" : "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.12;
      o.connect(g).connect(activeGain);
      o.start();
    });

    // ---- DREAM LAYER: detuned drifting drone ----
    const dreamGain = ctx.createGain();
    dreamGain.gain.value = 0.0;
    const dreamFilter = ctx.createBiquadFilter();
    dreamFilter.type = "lowpass";
    dreamFilter.frequency.value = 700;
    const dreamDelay = ctx.createDelay(2.0);
    dreamDelay.delayTime.value = 0.6;
    const dreamFb = ctx.createGain();
    dreamFb.gain.value = 0.45;
    dreamDelay.connect(dreamFb).connect(dreamDelay);
    dreamGain.connect(dreamFilter);
    dreamFilter.connect(master);
    dreamFilter.connect(dreamDelay);
    dreamDelay.connect(master);

    [55, 82.4, 110, 138.6, 164.8].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      // slow LFO for detune drift
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 6;
      lfo.connect(lfoGain).connect(o.detune);
      lfo.start();
      const g = ctx.createGain();
      g.gain.value = 0.09;
      // tremolo
      const trem = ctx.createOscillator();
      trem.frequency.value = 0.15 + i * 0.08;
      const tremGain = ctx.createGain();
      tremGain.gain.value = 0.04;
      trem.connect(tremGain).connect(g.gain);
      trem.start();
      o.connect(g).connect(dreamGain);
      o.start();
    });

    nodes.current = { activeGain, dreamGain, masterGain: master };

    // Fade master in
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(0.6, t + 1.5);

    return () => {
      ctx.close();
      ctxRef.current = null;
    };
  }, [enabled]);

  // Crossfade based on phase
  useEffect(() => {
    const ctx = ctxRef.current;
    const { activeGain, dreamGain } = nodes.current;
    if (!ctx || !activeGain || !dreamGain) return;
    const t = ctx.currentTime;

    const targets =
      phase === "awake" ? { a: 0.7, d: 0.0 } :
      phase === "drifting" ? { a: 0.4, d: 0.5 } :
      { a: 0.0, d: 0.95 };

    activeGain.gain.cancelScheduledValues(t);
    activeGain.gain.linearRampToValueAtTime(targets.a, t + 3.5);
    dreamGain.gain.cancelScheduledValues(t);
    dreamGain.gain.linearRampToValueAtTime(targets.d, t + 4.0);
  }, [phase]);

  // Trigger a soft chime
  const chime = (freq = 660) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2400;
    o.connect(g).connect(filter).connect(nodes.current.masterGain || ctx.destination);
    o.start(t);
    o.stop(t + 2.6);
  };

  return { chime };
}
