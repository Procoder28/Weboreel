// Lightweight Web Audio helpers — no external assets.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function clickReversed() {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(880, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.18);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.2);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.22);
}

export function errorBlip() {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(140, c.currentTime);
  o.frequency.linearRampToValueAtTime(90, c.currentTime + 0.12);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.12, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.14);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.16);
}

export function successChime() {
  const c = getCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const t = c.currentTime + i * 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.65);
  });
}

// Dramatic "reality break" — noise burst + descending sweep
export function realityBreak() {
  const c = getCtx();
  if (!c) return;
  // Noise burst
  const bufferSize = c.sampleRate * 1.2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.35, c.currentTime);
  ng.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.2);
  noise.connect(ng).connect(c.destination);
  noise.start();

  // Descending sweep
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(600, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 1.1);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.2);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 1.25);
}

// Ambient gameplay drone with adjustable intensity (0..1)
let ambientNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;

export function startAmbient() {
  const c = getCtx();
  if (!c || ambientNodes) return;
  const osc1 = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  osc1.type = "sawtooth";
  osc1.frequency.value = 55;
  osc2.type = "sine";
  osc2.frequency.value = 82.5; // perfect fifth-ish dissonance
  lfo.type = "sine";
  lfo.frequency.value = 0.25;
  lfoGain.gain.value = 4;
  lfo.connect(lfoGain).connect(osc1.frequency);
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.025, c.currentTime + 1.4);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(c.destination);
  osc1.start();
  osc2.start();
  lfo.start();
  ambientNodes = { osc1, osc2, gain, lfo, lfoGain };
}

export function setAmbientIntensity(t: number) {
  const c = getCtx();
  if (!c || !ambientNodes) return;
  const clamped = Math.max(0, Math.min(1, t));
  ambientNodes.gain.gain.linearRampToValueAtTime(0.025 + clamped * 0.06, c.currentTime + 0.4);
  ambientNodes.lfo.frequency.linearRampToValueAtTime(0.25 + clamped * 1.5, c.currentTime + 0.4);
}

export function stopAmbient() {
  const c = getCtx();
  if (!c || !ambientNodes) return;
  const { osc1, osc2, gain, lfo } = ambientNodes;
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6);
  osc1.stop(c.currentTime + 0.7);
  osc2.stop(c.currentTime + 0.7);
  lfo.stop(c.currentTime + 0.7);
  ambientNodes = null;
}

let calmNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;

export function startCalm() {
  const c = getCtx();
  if (!c || calmNodes) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = 220;
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain).connect(osc.frequency);
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.07, c.currentTime + 1.2);
  osc.connect(gain).connect(c.destination);
  osc.start();
  lfo.start();
  calmNodes = { osc, gain, lfo, lfoGain };
}

export function stopCalm() {
  const c = getCtx();
  if (!c || !calmNodes) return;
  const { osc, gain, lfo } = calmNodes;
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
  osc.stop(c.currentTime + 0.6);
  lfo.stop(c.currentTime + 0.6);
  calmNodes = null;
}
