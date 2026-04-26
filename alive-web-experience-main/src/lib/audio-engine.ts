// Lightweight Web Audio engine — generates ambient drones + SFX procedurally.
// No external audio files needed.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneNodes: { osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode }[] = [];
let currentPhase = 0;
let started = false;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.0;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

export async function startAudio() {
  const c = getCtx();
  if (c.state === "suspended") await c.resume();
  if (!started) {
    started = true;
    if (masterGain) masterGain.gain.linearRampToValueAtTime(0.5, c.currentTime + 1.5);
  }
}

function clearDrones(fadeMs = 1500) {
  if (!ctx) return;
  const t = ctx.currentTime;
  droneNodes.forEach(({ osc, gain, lfo }) => {
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0.0001, t + fadeMs / 1000);
    setTimeout(() => {
      try { osc.stop(); } catch {}
      try { lfo?.stop(); } catch {}
    }, fadeMs + 200);
  });
  droneNodes = [];
}

function buildDrone(freq: number, type: OscillatorType, gainVal: number, lfoFreq?: number, lfoDepth?: number) {
  const c = ctx!;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = c.createGain();
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(masterGain!);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(gainVal, c.currentTime + 2);

  let lfo: OscillatorNode | undefined;
  if (lfoFreq && lfoDepth) {
    lfo = c.createOscillator();
    lfo.frequency.value = lfoFreq;
    const lfoGain = c.createGain();
    lfoGain.gain.value = lfoDepth;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start();
  }
  droneNodes.push({ osc, gain, lfo });
}

export function setPhaseAudio(phase: number) {
  if (!ctx || phase === currentPhase) return;
  currentPhase = phase;
  clearDrones();

  // Each phase = different drone stack
  if (phase === 1) {
    buildDrone(110, "sine", 0.08);
    buildDrone(165, "sine", 0.04, 0.1, 1);
  } else if (phase === 2) {
    buildDrone(110, "sine", 0.08);
    buildDrone(165, "sine", 0.05, 0.15, 2);
    buildDrone(220, "triangle", 0.03, 0.2, 1.5);
  } else if (phase === 3) {
    buildDrone(98, "sine", 0.09);
    buildDrone(146, "triangle", 0.06, 0.25, 3);
    buildDrone(220, "sawtooth", 0.02, 0.3, 2);
    buildDrone(330, "sine", 0.025, 0.4, 4);
  } else if (phase === 4) {
    buildDrone(82, "sawtooth", 0.07, 0.4, 6);
    buildDrone(123, "triangle", 0.05, 0.35, 4);
    buildDrone(196, "sawtooth", 0.04, 0.5, 8);
    buildDrone(294, "sine", 0.03, 0.7, 6);
  } else if (phase === 5 || phase >= 6) {
    buildDrone(73, "sawtooth", 0.08, 0.6, 12);
    buildDrone(110, "square", 0.03, 0.8, 10);
    buildDrone(165, "sawtooth", 0.05, 1.2, 15);
    buildDrone(247, "triangle", 0.04, 1.5, 8);
    buildDrone(370, "sine", 0.03, 2, 20);
  }
}

// SFX helpers --------------------------------------------------
function envBeep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
  if (!ctx || !masterGain) return;
  const c = ctx;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = 0;
  osc.connect(g).connect(masterGain);
  const t = c.currentTime;
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function sfxClick() {
  envBeep(880 + Math.random() * 200, 0.06, "sine", 0.08);
}

export function sfxMorph() {
  if (!ctx || !masterGain) return;
  const c = ctx;
  const osc = c.createOscillator();
  osc.type = "sine";
  const g = c.createGain();
  osc.connect(g).connect(masterGain);
  const t = c.currentTime;
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.4);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  osc.start(t);
  osc.stop(t + 0.6);
}

export function sfxTransition() {
  if (!ctx || !masterGain) return;
  const c = ctx;
  // sweep down
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  osc.connect(filter).connect(g).connect(masterGain);
  const t = c.currentTime;
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 1.6);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.25, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  osc.start(t);
  osc.stop(t + 2);
}

export function sfxGlitch() {
  if (!ctx || !masterGain) return;
  const c = ctx;
  const bufferSize = 0.18 * c.sampleRate;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1500 + Math.random() * 2000;
  const g = c.createGain();
  g.gain.value = 0.18;
  src.connect(filter).connect(g).connect(masterGain);
  src.start();
}

export function stopAllAudio() {
  clearDrones(800);
  if (masterGain && ctx) {
    masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
  }
  started = false;
  currentPhase = 0;
}
