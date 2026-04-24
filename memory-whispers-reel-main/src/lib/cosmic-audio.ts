// Procedural audio engine using Web Audio API.
// No assets, no network — just oscillators, noise, and filters.

export class CosmicAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private started = false;
  private intensity = 0; // 0..1, grows with story progress
  private padOscs: OscillatorNode[] = [];

  async start() {
    if (this.started) return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    if (this.ctx.state === "suspended") await this.ctx.resume();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(this.ctx.destination);
    // fade in
    this.master.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 2);

    this.buildAmbientPad();
    this.buildWind();
    this.started = true;
  }

  private buildAmbientPad() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.35;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;

    const reverbDelay = ctx.createDelay();
    reverbDelay.delayTime.value = 0.35;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    reverbDelay.connect(feedback).connect(reverbDelay);

    // A minor 9 voicing — A2, C3, E3, G3, B3
    const freqs = [110, 130.81, 164.81, 196, 246.94];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      // slow detune drift
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.02;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2 + i;
      lfo.connect(lfoGain).connect(osc.detune);
      lfo.start();

      const g = ctx.createGain();
      g.gain.value = 0.18 / freqs.length;
      osc.connect(g).connect(filter);
      osc.start();
      this.padOscs.push(osc);
    });

    filter.connect(this.padGain);
    filter.connect(reverbDelay);
    reverbDelay.connect(this.padGain);
    this.padGain.connect(this.master);
  }

  private buildWind() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 600;
    bp.Q.value = 0.6;

    // slow filter sweep
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain).connect(bp.frequency);
    lfo.start();

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.06;

    noise.connect(bp).connect(this.windGain).connect(this.master);
    noise.start();
  }

  /** A quick sparkly chime when discovering a checkpoint. */
  chime(seed = 0) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const base = [523.25, 659.25, 783.99, 987.77, 1174.66][seed % 5];
    const partials = [1, 2, 3, 4.2];
    const now = ctx.currentTime;
    partials.forEach((p, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = base * p;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.18 / (i + 1), now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6 + i * 0.3);
      osc.connect(g).connect(this.master!);
      osc.start(now);
      osc.stop(now + 1.8 + i * 0.3);
    });
  }

  /** Soft hover ping. */
  hover() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.08, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(g).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** Subtle footstep tick. */
  step() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bufferSize = 0.08 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 280;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(filter).connect(g).connect(this.master);
    src.start(now);
  }

  /** Move overall mood as story progresses (0..1). */
  setIntensity(v: number) {
    this.intensity = Math.max(0, Math.min(1, v));
    if (!this.ctx || !this.padGain || !this.windGain) return;
    const t = this.ctx.currentTime;
    this.padGain.gain.linearRampToValueAtTime(0.35 + this.intensity * 0.25, t + 1.5);
    this.windGain.gain.linearRampToValueAtTime(0.06 + this.intensity * 0.08, t + 1.5);
  }

  /** Final cinematic swell. */
  finale() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.linearRampToValueAtTime(0.7, t + 2);
    this.master.gain.linearRampToValueAtTime(0.0, t + 9);
  }

  stop() {
    this.padOscs.forEach((o) => {
      try {
        o.stop();
      } catch {
        // ignore
      }
    });
    this.ctx?.close();
    this.ctx = null;
    this.started = false;
  }
}
