// Web Audio synthesized engine sounds + UI SFX. Lightweight, no external assets.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let engineNodes: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;
let muted = false;

function ensureCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain && ctx) masterGain.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.05);
}
export function isMuted() { return muted; }

// Soft mechanical click for slider adjust
export function playClick() {
  const c = ensureCtx(); if (!c || !masterGain) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(900, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.05);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.07);
  osc.connect(g).connect(masterGain);
  osc.start(); osc.stop(c.currentTime + 0.08);
}

// Switch toggle
export function playToggle() {
  const c = ensureCtx(); if (!c || !masterGain) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(600, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.06);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.22, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);
  osc.connect(g).connect(masterGain);
  osc.start(); osc.stop(c.currentTime + 0.13);
}

// Button press
export function playPress() {
  const c = ensureCtx(); if (!c || !masterGain) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.15);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
  osc.connect(g).connect(masterGain);
  osc.start(); osc.stop(c.currentTime + 0.2);
}

// Engine rev — long, swelling F1 scream-ish using FM
export function playRev(durationSec = 2.5) {
  const c = ensureCtx(); if (!c || !masterGain) return;
  const carrier = c.createOscillator();
  const mod = c.createOscillator();
  const modGain = c.createGain();
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, c.currentTime);
  filter.frequency.linearRampToValueAtTime(4500, c.currentTime + durationSec * 0.5);
  filter.frequency.linearRampToValueAtTime(2000, c.currentTime + durationSec);

  carrier.type = "sawtooth";
  carrier.frequency.setValueAtTime(110, c.currentTime);
  carrier.frequency.exponentialRampToValueAtTime(680, c.currentTime + durationSec * 0.55);
  carrier.frequency.exponentialRampToValueAtTime(420, c.currentTime + durationSec);

  mod.type = "square";
  mod.frequency.setValueAtTime(55, c.currentTime);
  mod.frequency.linearRampToValueAtTime(220, c.currentTime + durationSec);
  modGain.gain.value = 90;
  mod.connect(modGain).connect(carrier.frequency);

  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.35, c.currentTime + 0.15);
  g.gain.linearRampToValueAtTime(0.3, c.currentTime + durationSec - 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationSec);

  carrier.connect(filter).connect(g).connect(masterGain);
  carrier.start(); mod.start();
  carrier.stop(c.currentTime + durationSec + 0.05);
  mod.stop(c.currentTime + durationSec + 0.05);
}

// Pass-by doppler whoosh for result reveal
export function playPassBy() {
  const c = ensureCtx(); if (!c || !masterGain) return;
  const dur = 1.4;
  const osc = c.createOscillator();
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  const noise = c.createBufferSource();
  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  noise.buffer = buffer;
  const noiseGain = c.createGain();
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(400, c.currentTime);
  noiseFilter.frequency.exponentialRampToValueAtTime(3500, c.currentTime + dur * 0.5);
  noiseFilter.frequency.exponentialRampToValueAtTime(300, c.currentTime + dur);
  noiseGain.gain.setValueAtTime(0.0001, c.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.25, c.currentTime + dur * 0.45);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + dur * 0.5);
  osc.frequency.exponentialRampToValueAtTime(120, c.currentTime + dur);
  filter.type = "lowpass";
  filter.frequency.value = 2500;
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.3, c.currentTime + dur * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);

  osc.connect(filter).connect(g).connect(masterGain);
  noise.connect(noiseFilter).connect(noiseGain).connect(masterGain);
  osc.start(); noise.start();
  osc.stop(c.currentTime + dur);
  noise.stop(c.currentTime + dur);
}

// Crowd cheer — filtered noise burst with shimmer
export function playCheer() {
  const c = ensureCtx(); if (!c || !masterGain) return;
  const dur = 2.2;
  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.sin((i / data.length) * Math.PI);
    data[i] = (Math.random() * 2 - 1) * env * 0.6;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.35, c.currentTime + 0.4);
  g.gain.linearRampToValueAtTime(0.25, c.currentTime + dur - 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  noise.connect(filter).connect(g).connect(masterGain);
  noise.start(); noise.stop(c.currentTime + dur);
}

// Disappointment tone — descending minor
export function playFail() {
  const c = ensureCtx(); if (!c || !masterGain) return;
  const notes = [330, 277, 220];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const t = c.currentTime + i * 0.18;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(g).connect(masterGain!);
    osc.start(t); osc.stop(t + 0.42);
  });
}

// Background engine hum — start/stop loop
export function startEngineHum() {
  const c = ensureCtx(); if (!c || !masterGain || engineNodes) return;
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();

  osc.type = "sawtooth";
  osc.frequency.value = 60;
  osc2.type = "triangle";
  osc2.frequency.value = 90;

  filter.type = "lowpass";
  filter.frequency.value = 320;
  filter.Q.value = 4;

  // LFO modulates filter for organic breathing engine
  lfo.frequency.value = 0.4;
  lfoGain.gain.value = 80;
  lfo.connect(lfoGain).connect(filter.frequency);

  gain.gain.value = 0;
  gain.gain.setTargetAtTime(0.06, c.currentTime, 1.5);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain).connect(masterGain);

  osc.start(); osc2.start(); lfo.start();
  engineNodes = { osc, osc2, gain, lfo, lfoGain };
}

export function stopEngineHum() {
  if (!ctx || !engineNodes) return;
  const { osc, osc2, gain, lfo } = engineNodes;
  const t = ctx.currentTime;
  gain.gain.setTargetAtTime(0, t, 0.4);
  setTimeout(() => {
    try { osc.stop(); osc2.stop(); lfo.stop(); } catch {}
    engineNodes = null;
  }, 1200);
}
