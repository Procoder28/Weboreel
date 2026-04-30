// Adaptive Web Audio engine. Generates ambient drone + reactive SFX procedurally.
// No external audio files needed.

type Mood = "calm" | "tense" | "glitch";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private distortion: WaveShaperNode | null = null;
  private heartbeatTimer: number | null = null;
  private started = false;
  private mood: Mood = "calm";

  async start() {
    if (this.started) return;
    const Ctx =
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext || window.AudioContext;
    this.ctx = new Ctx();
    await this.ctx.resume();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 900;
    this.filter.Q.value = 0.5;

    this.distortion = this.ctx.createWaveShaper();
    this.distortion.curve = this.makeCurve(0) as Float32Array<ArrayBuffer>;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.25;

    this.droneGain.connect(this.distortion);
    this.distortion.connect(this.filter);
    this.filter.connect(this.master);

    // Layered drone — minor chord-ish
    const freqs = [55, 82.5, 110, 164.8, 220];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.value = 0.18 / (i + 1);
      osc.connect(g);
      g.connect(this.droneGain!);
      osc.start();
      this.oscillators.push(osc);
    });

    // LFO for breathing motion on filter
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.value = 0.12;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // Fade in master
    this.master.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 3);
    this.started = true;
  }

  private makeCurve(amount: number): Float32Array {
    const n = 1024;
    const curve = new Float32Array(n);
    const k = amount * 80;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  setMood(mood: Mood) {
    if (!this.ctx || !this.filter || !this.lfo || !this.distortion) return;
    if (this.mood === mood) return;
    this.mood = mood;
    const t = this.ctx.currentTime;

    if (mood === "calm") {
      this.filter.frequency.cancelScheduledValues(t);
      this.filter.frequency.linearRampToValueAtTime(900, t + 4);
      this.lfo.frequency.linearRampToValueAtTime(0.12, t + 4);
      this.distortion.curve = this.makeCurve(0) as Float32Array<ArrayBuffer>;
      this.stopHeartbeat();
    } else if (mood === "tense") {
      this.filter.frequency.linearRampToValueAtTime(1600, t + 2.5);
      this.lfo.frequency.linearRampToValueAtTime(0.5, t + 2.5);
      this.distortion.curve = this.makeCurve(0.25) as Float32Array<ArrayBuffer>;
      this.startHeartbeat(900);
    } else {
      this.filter.frequency.linearRampToValueAtTime(2400, t + 1.5);
      this.lfo.frequency.linearRampToValueAtTime(1.6, t + 1.5);
      this.distortion.curve = this.makeCurve(0.7) as Float32Array<ArrayBuffer>;
      this.startHeartbeat(560);
    }
  }

  private startHeartbeat(interval: number) {
    this.stopHeartbeat();
    const tick = () => {
      this.thud();
      this.heartbeatTimer = window.setTimeout(() => {
        this.thud(0.7);
        this.heartbeatTimer = window.setTimeout(tick, interval - 160);
      }, 160);
    };
    tick();
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private thud(vol = 1) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45 * vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // SFX
  warningTone() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.linearRampToValueAtTime(620, t + 0.25);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  click(irritated = false) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = irritated ? "square" : "triangle";
    osc.frequency.value = irritated ? 1800 : 1200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(irritated ? 0.18 : 0.08, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  chime() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    [1318.5, 1760, 2637].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      const start = t + i * 0.08;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.09, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
      osc.connect(g);
      g.connect(this.master!);
      osc.start(start);
      osc.stop(start + 1.5);
    });
  }

  mystery() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 1.2);
    const filt = this.ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 600;
    filt.Q.value = 8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 1.35);
  }

  glitchBurst() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = "highpass";
    filt.frequency.value = 1200;
    const g = this.ctx.createGain();
    g.gain.value = 0.18;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  duck(amount = 0.2, duration = 0.4) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const current = this.master.gain.value;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(current, t);
    this.master.gain.linearRampToValueAtTime(amount, t + 0.05);
    this.master.gain.linearRampToValueAtTime(0.5, t + duration);
  }
}

export const audio = new AudioEngine();
