// Lightweight Web Audio sound design. No external assets — synthesized.

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicNodes: { stop: () => void } | null = null;
let muted = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(v ? 0 : 0.06, ctx.currentTime, 0.1);
}
export function isMuted() { return muted; }

function envTone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.2, when = 0) {
  const c = getCtx(); if (!c || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur: number, gain = 0.2, freq = 1200, when = 0) {
  const c = getCtx(); if (!c || muted) return;
  const t0 = c.currentTime + when;
  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filt = c.createBiquadFilter();
  filt.type = "bandpass"; filt.frequency.value = freq; filt.Q.value = 1.2;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  click: () => envTone(620, 0.06, "square", 0.08),
  generate: () => {
    envTone(440, 0.12, "sawtooth", 0.06);
    envTone(880, 0.18, "sine", 0.08, 0.05);
    envTone(1320, 0.22, "triangle", 0.06, 0.1);
  },
  reveal: () => {
    [523, 659, 784, 1046].forEach((f, i) => envTone(f, 0.25, "triangle", 0.12, i * 0.06));
  },
  applause: () => {
    for (let i = 0; i < 14; i++) noiseBurst(0.25, 0.05 + Math.random() * 0.05, 800 + Math.random() * 1600, i * 0.04);
  },
  typing: () => {
    for (let i = 0; i < 8; i++) noiseBurst(0.04, 0.06, 2400, i * 0.06);
  },
  cash: () => {
    envTone(1568, 0.08, "square", 0.1);
    envTone(2093, 0.1, "square", 0.1, 0.06);
    noiseBurst(0.3, 0.08, 4000, 0.12);
  },
  fail: () => {
    envTone(220, 0.4, "sawtooth", 0.12);
    envTone(180, 0.5, "sawtooth", 0.1, 0.05);
  },
};

export function startMusic() {
  const c = getCtx(); if (!c) return;
  if (musicNodes) return;
  musicGain = c.createGain();
  musicGain.gain.value = muted ? 0 : 0.06;
  musicGain.connect(c.destination);

  // Simple bass arpeggio + pad — feels "startup keynote-y"
  const bass = c.createOscillator();
  bass.type = "sawtooth";
  const bassFilt = c.createBiquadFilter();
  bassFilt.type = "lowpass"; bassFilt.frequency.value = 600;
  const bassGain = c.createGain(); bassGain.gain.value = 0.35;
  bass.connect(bassFilt).connect(bassGain).connect(musicGain);
  bass.start();

  const notes = [110, 138.59, 164.81, 220, 164.81, 138.59];
  let i = 0;
  const tick = setInterval(() => {
    if (!c || !musicGain) return;
    bass.frequency.setTargetAtTime(notes[i % notes.length], c.currentTime, 0.02);
    i++;
  }, 280);

  // Pad
  const pad = c.createOscillator();
  pad.type = "sine"; pad.frequency.value = 220;
  const padGain = c.createGain(); padGain.gain.value = 0.15;
  const padFilt = c.createBiquadFilter();
  padFilt.type = "lowpass"; padFilt.frequency.value = 1200;
  pad.connect(padFilt).connect(padGain).connect(musicGain);
  pad.start();

  // Shimmer
  const shimmer = c.createOscillator();
  shimmer.type = "triangle"; shimmer.frequency.value = 880;
  const shimGain = c.createGain(); shimGain.gain.value = 0.04;
  shimmer.connect(shimGain).connect(musicGain);
  shimmer.start();

  musicNodes = {
    stop: () => {
      clearInterval(tick);
      try { bass.stop(); pad.stop(); shimmer.stop(); } catch { /* ignore */ }
      musicGain?.disconnect();
      musicGain = null;
      musicNodes = null;
    },
  };
}

export function stopMusic() {
  musicNodes?.stop();
}
