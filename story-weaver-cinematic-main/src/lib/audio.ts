// Tiny WebAudio engine — generates ambient pads + SFX procedurally.
// No assets to download. Smooth crossfades between mood beds.

import type { Mood } from "./story";

type Bed = {
  osc: OscillatorNode[];
  gain: GainNode;
  filter: BiquadFilterNode;
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private currentBed: Bed | null = null;
  private muted = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.35;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime + 0.4);
    }
  }

  isMuted() { return this.muted; }

  private moodConfig(mood: Mood): { freqs: number[]; type: OscillatorType; cutoff: number; q: number } {
    switch (mood) {
      case "calm":     return { freqs: [110, 165, 220], type: "sine",     cutoff: 800, q: 1 };
      case "hope":     return { freqs: [146.83, 220, 293.66], type: "triangle", cutoff: 1400, q: 1 };
      case "suspense": return { freqs: [82.4, 87.3, 130.8], type: "sawtooth", cutoff: 350, q: 4 };
      case "intense":  return { freqs: [55, 58.27, 110, 138.59], type: "sawtooth", cutoff: 500, q: 6 };
      case "dread":    return { freqs: [41.2, 43.65, 87.3], type: "sawtooth", cutoff: 240, q: 8 };
    }
  }

  playMood(mood: Mood) {
    const ctx = this.ensure();
    if (!this.master) return;

    // Fade out previous bed
    if (this.currentBed) {
      const old = this.currentBed;
      old.gain.gain.cancelScheduledValues(ctx.currentTime);
      old.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
      setTimeout(() => {
        old.osc.forEach(o => { try { o.stop(); } catch { /* */ } });
      }, 1700);
    }

    const cfg = this.moodConfig(mood);
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cfg.cutoff;
    filter.Q.value = cfg.q;

    const osc = cfg.freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = cfg.type;
      o.frequency.value = f;
      // slight detune drift via LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07 + i * 0.03;
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain).connect(o.detune);
      lfo.start();

      const oGain = ctx.createGain();
      oGain.gain.value = 0.9 / cfg.freqs.length;
      o.connect(oGain).connect(filter);
      o.start();
      return o;
    });

    filter.connect(gain).connect(this.master);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 2.0);

    this.currentBed = { osc, gain, filter };
  }

  // Short SFX
  sfx(kind: "click" | "transition" | "heartbeat" | "creak") {
    const ctx = this.ensure();
    if (!this.master) return;
    const now = ctx.currentTime;

    if (kind === "click") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 440;
      o.type = "sine";
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      o.connect(g).connect(this.master);
      o.start(now); o.stop(now + 0.2);
    }
    if (kind === "transition") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, now);
      o.frequency.exponentialRampToValueAtTime(110, now + 0.9);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      o.connect(g).connect(this.master);
      o.start(now); o.stop(now + 1.05);
    }
    if (kind === "heartbeat") {
      [0, 0.18].forEach((t) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = 60;
        g.gain.setValueAtTime(0.001, now + t);
        g.gain.exponentialRampToValueAtTime(0.5, now + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.2);
        o.connect(g).connect(this.master!);
        o.start(now + t); o.stop(now + t + 0.25);
      });
    }
    if (kind === "creak") {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filt = ctx.createBiquadFilter();
      filt.type = "bandpass";
      filt.frequency.value = 320;
      filt.Q.value = 8;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      src.connect(filt).connect(g).connect(this.master);
      src.start(now);
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }
}

export const audio = new AudioEngine();
