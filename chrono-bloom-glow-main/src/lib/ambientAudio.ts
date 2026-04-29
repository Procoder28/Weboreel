import type { Phase } from "./themes";

// Lightweight WebAudio ambient generator — no external assets.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let nodes: { stop: () => void }[] = [];

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  return ctx!;
}

function clearNodes() {
  nodes.forEach((n) => n.stop());
  nodes = [];
}

function makePad(freq: number, gain: number, type: OscillatorType = "sine") {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  lfo.frequency.value = 0.08 + Math.random() * 0.1;
  lfoGain.gain.value = gain * 0.4;
  lfo.connect(lfoGain).connect(g.gain);
  osc.connect(g).connect(master!);
  osc.start();
  lfo.start();
  return {
    stop: () => {
      try { osc.stop(); lfo.stop(); } catch { /* noop */ }
      osc.disconnect(); g.disconnect(); lfo.disconnect(); lfoGain.disconnect();
    },
  };
}

function makeNoise(gain: number, filterFreq: number) {
  const c = ensureCtx();
  const bufferSize = 2 * c.sampleRate;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.value = gain;
  noise.connect(filter).connect(g).connect(master!);
  noise.start();
  return {
    stop: () => {
      try { noise.stop(); } catch { /* noop */ }
      noise.disconnect(); filter.disconnect(); g.disconnect();
    },
  };
}

export function setPhaseAudio(phase: Phase) {
  ensureCtx();
  clearNodes();
  if (phase === "morning") {
    nodes.push(makePad(523.25, 0.04));
    nodes.push(makePad(659.25, 0.03));
    nodes.push(makeNoise(0.015, 2200));
  } else if (phase === "evening") {
    nodes.push(makePad(220, 0.05));
    nodes.push(makePad(329.63, 0.035));
    nodes.push(makePad(440, 0.02, "triangle"));
  } else {
    nodes.push(makePad(110, 0.06));
    nodes.push(makePad(164.81, 0.035));
    nodes.push(makeNoise(0.01, 600));
  }
}

export async function enableAudio(phase: Phase) {
  const c = ensureCtx();
  if (c.state === "suspended") await c.resume();
  setPhaseAudio(phase);
  if (master) master.gain.linearRampToValueAtTime(0.5, c.currentTime + 1.2);
}

export function disableAudio() {
  if (!ctx || !master) return;
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  setTimeout(() => clearNodes(), 700);
}
