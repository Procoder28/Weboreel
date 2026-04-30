import type { World } from "./thoughtEngine";

// Adaptive ambient audio engine using Web Audio API only (no assets).
// Builds drones, pads, and texture per world.

type Voice = {
  osc: OscillatorNode;
  gain: GainNode;
  filter?: BiquadFilterNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
};

const WORLD_PRESETS: Record<World, {
  base: number[];          // base frequencies (Hz)
  waveform: OscillatorType;
  filterFreq: number;
  filterQ: number;
  masterGain: number;
  detune: number;
  noise?: "rain" | "static" | "wind" | "sparkle";
}> = {
  cosmic:    { base: [110, 164.81, 220, 329.63], waveform: "sine",     filterFreq: 1200, filterQ: 4, masterGain: 0.18, detune: 8, noise: "sparkle" },
  nostalgia: { base: [130.81, 196, 261.63, 329.63], waveform: "triangle", filterFreq: 900,  filterQ: 2, masterGain: 0.2,  detune: 6, noise: "wind" },
  melancholy:{ base: [82.41, 123.47, 164.81, 246.94], waveform: "sine",  filterFreq: 600,  filterQ: 3, masterGain: 0.22, detune: 4, noise: "rain" },
  peace:     { base: [146.83, 220, 293.66, 440],  waveform: "sine",     filterFreq: 1400, filterQ: 1.5, masterGain: 0.18, detune: 5, noise: "wind" },
  hope:      { base: [174.61, 261.63, 349.23, 523.25], waveform: "triangle", filterFreq: 1800, filterQ: 1.5, masterGain: 0.18, detune: 6, noise: "sparkle" },
  chaos:     { base: [98, 138.59, 207.65, 277.18], waveform: "sawtooth", filterFreq: 800, filterQ: 6, masterGain: 0.16, detune: 22, noise: "static" },
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: Voice[] = [];
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private currentWorld: World | null = null;
  private started = false;

  async start() {
    if (this.started) return;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctor();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    this.started = true;
  }

  isStarted() { return this.started; }

  setWorld(world: World, intensity = 0.5) {
    if (!this.ctx || !this.master) return;
    if (this.currentWorld === world) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(WORLD_PRESETS[world].masterGain * (0.6 + intensity * 0.6), this.ctx.currentTime + 1.5);
      return;
    }
    this.currentWorld = world;
    this.fadeOutVoices(2);
    setTimeout(() => this.buildVoices(world, intensity), 600);
  }

  private buildVoices(world: World, intensity: number) {
    if (!this.ctx || !this.master) return;
    const preset = WORLD_PRESETS[world];
    const ctx = this.ctx;

    preset.base.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = preset.waveform;
      osc.frequency.value = freq;
      osc.detune.value = (i % 2 === 0 ? 1 : -1) * preset.detune;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = preset.filterFreq;
      filter.Q.value = preset.filterQ;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      // Slow LFO on gain for breathing
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain).connect(gain.gain);

      osc.connect(filter).connect(gain).connect(this.master!);
      osc.start();
      lfo.start();

      gain.gain.linearRampToValueAtTime(0.25 / preset.base.length, ctx.currentTime + 4);
      this.voices.push({ osc, gain, filter, lfo, lfoGain });
    });

    // Noise texture
    this.buildNoise(preset.noise);

    // Master fade in
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(preset.masterGain * (0.6 + intensity * 0.6), ctx.currentTime + 3);
  }

  private buildNoise(kind?: "rain" | "static" | "wind" | "sparkle") {
    if (!this.ctx || !this.master || !kind) return;
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    gain.gain.value = 0;

    if (kind === "rain")     { filter.type = "lowpass";  filter.frequency.value = 2000; gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 4); }
    if (kind === "wind")     { filter.type = "lowpass";  filter.frequency.value = 700;  gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 4); }
    if (kind === "sparkle")  { filter.type = "highpass"; filter.frequency.value = 4000; gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 4); }
    if (kind === "static")   { filter.type = "bandpass"; filter.frequency.value = 1500; filter.Q.value = 0.6; gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4); }

    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    this.noiseNode = src;
    this.noiseGain = gain;
    this.noiseFilter = filter;
  }

  private fadeOutVoices(seconds = 2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.voices.forEach((v) => {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.linearRampToValueAtTime(0, t + seconds);
      setTimeout(() => { try { v.osc.stop(); v.lfo?.stop(); } catch {} }, (seconds + 0.5) * 1000);
    });
    this.voices = [];

    if (this.noiseGain && this.noiseNode) {
      const ng = this.noiseGain;
      const nn = this.noiseNode;
      ng.gain.cancelScheduledValues(t);
      ng.gain.linearRampToValueAtTime(0, t + seconds);
      setTimeout(() => { try { nn.stop(); } catch {} }, (seconds + 0.5) * 1000);
      this.noiseNode = null;
      this.noiseGain = null;
    }
  }

  // Soft input feedback
  pulse() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880 + Math.random() * 400;
    gain.gain.value = 0;
    osc.connect(gain).connect(this.master);
    osc.start();
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.stop(ctx.currentTime + 0.7);
  }

  stop() {
    this.fadeOutVoices(1.5);
  }
}

export const audioEngine = new AudioEngine();
