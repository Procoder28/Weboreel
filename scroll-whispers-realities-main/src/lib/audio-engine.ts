// Procedural ambient audio engine using Web Audio API.
// Each universe gets a unique sonic signature synthesized in real time —
// no external audio files needed.

export type UniverseKey = "intro" | "cyberpunk" | "medieval" | "underwater" | "space" | "nature";

type Voice = {
  stop: () => void;
  gain: GainNode;
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private current: UniverseKey | null = null;
  private voices: Voice[] = [];
  private started = false;

  async start() {
    if (this.started) return;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.started = true;
  }

  isStarted() { return this.started; }

  setMasterVolume(v: number) {
    if (this.master) this.master.gain.value = v;
  }

  async transitionTo(universe: UniverseKey) {
    if (!this.started) return;
    if (this.current === universe) return;
    this.current = universe;
    // Fade out existing voices
    const old = this.voices;
    this.voices = [];
    const now = this.ctx!.currentTime;
    for (const v of old) {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setValueAtTime(v.gain.gain.value, now);
      v.gain.gain.linearRampToValueAtTime(0, now + 1.4);
      setTimeout(() => v.stop(), 1600);
    }
    // Build new voices
    switch (universe) {
      case "intro": this.buildIntro(); break;
      case "cyberpunk": this.buildCyberpunk(); break;
      case "medieval": this.buildMedieval(); break;
      case "underwater": this.buildUnderwater(); break;
      case "space": this.buildSpace(); break;
      case "nature": this.buildNature(); break;
    }
  }

  private fadeIn(gain: GainNode, target: number, time = 2) {
    const now = this.ctx!.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(target, now + time);
  }

  private drone(freq: number, type: OscillatorType, detune = 0, vol = 0.15, filterFreq = 1200) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start();
    this.fadeIn(gain, vol);
    const voice: Voice = {
      gain,
      stop: () => { try { osc.stop(); } catch {} },
    };
    this.voices.push(voice);
    return voice;
  }

  private noise(vol = 0.05, filterType: BiquadFilterType = "bandpass", filterFreq = 800, q = 1) {
    const ctx = this.ctx!;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master!);
    src.start();
    this.fadeIn(gain, vol, 3);
    const voice: Voice = { gain, stop: () => { try { src.stop(); } catch {} } };
    this.voices.push(voice);
    return voice;
  }

  private buildIntro() {
    this.drone(110, "sine", 0, 0.12, 600);
    this.drone(165, "sine", 8, 0.08, 800);
    this.drone(220, "triangle", -5, 0.05, 1000);
  }

  private buildCyberpunk() {
    this.drone(55, "sawtooth", 0, 0.1, 400);
    this.drone(110, "sawtooth", 7, 0.07, 800);
    this.drone(220, "square", -3, 0.04, 1500);
    this.noise(0.03, "highpass", 3000, 0.5);
  }

  private buildMedieval() {
    this.drone(146.83, "triangle", 0, 0.1, 1200); // D
    this.drone(220, "triangle", 0, 0.06, 1500); // A
    this.drone(293.66, "sine", 5, 0.05, 1800); // D oct
    this.noise(0.02, "lowpass", 400, 0.5); // wind
  }

  private buildUnderwater() {
    this.drone(65, "sine", 0, 0.14, 300);
    this.drone(98, "sine", 12, 0.08, 500);
    this.noise(0.04, "lowpass", 600, 0.7);
  }

  private buildSpace() {
    this.drone(40, "sine", 0, 0.13, 250);
    this.drone(60, "sine", 15, 0.08, 400);
    this.drone(180, "triangle", -10, 0.04, 2000);
    this.noise(0.025, "bandpass", 2000, 2);
  }

  private buildNature() {
    this.drone(196, "triangle", 0, 0.06, 1200);
    this.drone(261.63, "sine", 0, 0.05, 1500);
    this.noise(0.06, "bandpass", 1200, 0.8); // wind/leaves
    // bird-like chirps
    const ctx = this.ctx!;
    const interval = setInterval(() => {
      if (this.current !== "nature") { clearInterval(interval); return; }
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const base = 1800 + Math.random() * 1500;
      osc.frequency.setValueAtTime(base, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(base * 1.4, ctx.currentTime + 0.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(g).connect(this.master!);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }, 2500);
  }
}

export const audioEngine = new AudioEngine();
