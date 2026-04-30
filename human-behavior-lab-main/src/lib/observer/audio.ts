// Procedural audio engine — no asset files. Web Audio API only.
// Generates ambient hum, heartbeat, ticks, drones, static.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let humOsc: OscillatorNode | null = null;
let humGain: GainNode | null = null;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let staticNode: AudioBufferSourceNode | null = null;
let staticGain: GainNode | null = null;
let heartbeatTimer: number | null = null;
let started = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = (window.AudioContext || (window as any).webkitAudioContext);
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

function createNoiseBuffer(duration = 2): AudioBuffer | null {
  const c = ac();
  if (!c) return null;
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  return buf;
}

export function startAudio() {
  const c = ac();
  if (!c || started) return;
  started = true;
  if (c.state === "suspended") c.resume();

  masterGain = c.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(c.destination);

  // Low ambient hum
  humOsc = c.createOscillator();
  humOsc.type = "sine";
  humOsc.frequency.value = 55;
  humGain = c.createGain();
  humGain.gain.value = 0.0;
  humOsc.connect(humGain).connect(masterGain);
  humOsc.start();

  // Drone (atmospheric)
  droneOsc = c.createOscillator();
  droneOsc.type = "sawtooth";
  droneOsc.frequency.value = 82;
  const droneFilter = c.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 220;
  droneGain = c.createGain();
  droneGain.gain.value = 0.0;
  droneOsc.connect(droneFilter).connect(droneGain).connect(masterGain);
  droneOsc.start();

  // Static
  const noiseBuf = createNoiseBuffer(4);
  if (noiseBuf) {
    staticNode = c.createBufferSource();
    staticNode.buffer = noiseBuf;
    staticNode.loop = true;
    const sFilter = c.createBiquadFilter();
    sFilter.type = "highpass";
    sFilter.frequency.value = 2000;
    staticGain = c.createGain();
    staticGain.gain.value = 0.0;
    staticNode.connect(sFilter).connect(staticGain).connect(masterGain);
    staticNode.start();
  }

  // Fade hum in
  fade(humGain.gain, 0.18, 4);
}

function fade(param: AudioParam, target: number, seconds: number) {
  const c = ac();
  if (!c) return;
  param.cancelScheduledValues(c.currentTime);
  param.setValueAtTime(param.value, c.currentTime);
  param.linearRampToValueAtTime(target, c.currentTime + seconds);
}

export function setTension(level: number) {
  // level 0..5
  if (!started) return;
  const c = ac();
  if (!c) return;
  if (humGain) fade(humGain.gain, 0.15 + level * 0.04, 3);
  if (droneGain) fade(droneGain.gain, level >= 2 ? 0.05 + (level - 2) * 0.04 : 0, 4);
  if (staticGain) fade(staticGain.gain, level >= 3 ? 0.015 + (level - 3) * 0.012 : 0, 3);

  if (level >= 2) startHeartbeat(level);
  else stopHeartbeat();
}

function startHeartbeat(level: number) {
  if (heartbeatTimer) return;
  const beat = () => {
    playHeartbeatPulse(level);
    const interval = Math.max(700, 1400 - level * 130);
    setTimeout(() => playHeartbeatPulse(level), 180);
    heartbeatTimer = window.setTimeout(beat, interval);
  };
  beat();
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function playHeartbeatPulse(level: number) {
  const c = ac();
  if (!c || !masterGain) return;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(60, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(35, c.currentTime + 0.25);
  const g = c.createGain();
  const peak = 0.12 + level * 0.04;
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(peak, c.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.35);
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + 0.4);
}

export function playTick() {
  const c = ac();
  if (!c || !masterGain || !started) return;
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.value = 1800;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.06, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + 0.08);
}

export function playEerie() {
  const c = ac();
  if (!c || !masterGain || !started) return;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, c.currentTime);
  osc.frequency.linearRampToValueAtTime(140, c.currentTime + 2);
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.6);
  g.gain.linearRampToValueAtTime(0, c.currentTime + 2.2);
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + 2.3);
}

export function playReveal() {
  const c = ac();
  if (!c || !masterGain || !started) return;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 1.2);
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.25, c.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.4);
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + 1.5);
}

export function playWhisperHover() {
  const c = ac();
  if (!c || !masterGain || !started) return;
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 900 + Math.random() * 400;
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.015, c.currentTime + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + 0.2);
}