// WebAudio engine — synthesized music + SFX (no external assets needed)
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let musicTimer: number | null = null;
let musicIntensity = 0; // 0..1
let musicRunning = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.9;
    sfxGain.connect(masterGain);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

export function setMasterVolume(v: number) {
  ensureCtx();
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
}

export function setMuted(muted: boolean) {
  ensureCtx();
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.7;
}

// ============ SFX ============
function envBeep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3) {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g);
  g.connect(sfxGain!);
  osc.start();
  osc.stop(c.currentTime + dur + 0.05);
}

export function sfxFlash() {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.12);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.linearRampToValueAtTime(0.35, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.15);
  osc.connect(g);
  g.connect(sfxGain!);
  osc.start();
  osc.stop(c.currentTime + 0.2);
}

export function sfxClick() {
  envBeep(880, 0.08, "square", 0.22);
  setTimeout(() => envBeep(1320, 0.06, "sine", 0.18), 30);
}

export function sfxCorrect() {
  envBeep(660, 0.1, "sine", 0.3);
  setTimeout(() => envBeep(880, 0.1, "sine", 0.3), 80);
  setTimeout(() => envBeep(1320, 0.18, "triangle", 0.35), 160);
}

export function sfxWrong() {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.4);
  g.gain.setValueAtTime(0.4, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.45);
  osc.connect(g);
  g.connect(sfxGain!);
  osc.start();
  osc.stop(c.currentTime + 0.5);
}

export function sfxTick() {
  envBeep(1500, 0.04, "square", 0.18);
}

export function sfxGameOver() {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(440, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 1.2);
  g.gain.setValueAtTime(0.45, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.3);
  osc.connect(g);
  g.connect(sfxGain!);
  osc.start();
  osc.stop(c.currentTime + 1.4);

  // Sub drop
  const sub = c.createOscillator();
  const sg = c.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(120, c.currentTime);
  sub.frequency.exponentialRampToValueAtTime(20, c.currentTime + 1.2);
  sg.gain.setValueAtTime(0.5, c.currentTime);
  sg.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.3);
  sub.connect(sg);
  sg.connect(sfxGain!);
  sub.start();
  sub.stop(c.currentTime + 1.4);
}

// ============ MUSIC ============
// Procedural arpeggio loop — intensity ramps tempo + filter
const SCALE = [0, 3, 5, 7, 10, 12, 15]; // minor pentatonic-ish
const ROOT_FREQ = 110; // A2

function noteFreq(semis: number) {
  return ROOT_FREQ * Math.pow(2, semis / 12);
}

function playNote(time: number, freq: number, dur: number, vol: number) {
  const c = ctx!;
  const osc = c.createOscillator();
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600 + musicIntensity * 3000;
  filter.Q.value = 4;
  osc.type = musicIntensity > 0.5 ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(freq, time);
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(filter);
  filter.connect(g);
  g.connect(musicGain!);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function playKick(time: number, vol: number) {
  const c = ctx!;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
  osc.connect(g);
  g.connect(musicGain!);
  osc.start(time);
  osc.stop(time + 0.25);
}

let stepIdx = 0;

function scheduleStep() {
  if (!musicRunning || !ctx) return;
  const now = ctx.currentTime;
  // tempo: 90 bpm at 0 intensity → 160 bpm at 1
  const bpm = 90 + musicIntensity * 70;
  const stepDur = 60 / bpm / 2; // 8th notes

  // Note
  const degree = SCALE[stepIdx % SCALE.length];
  const oct = Math.floor(stepIdx / SCALE.length) % 2;
  const f = noteFreq(degree + oct * 12);
  playNote(now, f, stepDur * 1.5, 0.18 + musicIntensity * 0.15);

  // Bass on downbeats
  if (stepIdx % 4 === 0) {
    playNote(now, noteFreq(0) / 2, stepDur * 3, 0.12 + musicIntensity * 0.1);
  }
  // Kick
  if (musicIntensity > 0.25 && stepIdx % 2 === 0) {
    playKick(now, 0.35 + musicIntensity * 0.3);
  }

  stepIdx++;
  musicTimer = window.setTimeout(scheduleStep, stepDur * 1000);
}

export function startMusic() {
  ensureCtx();
  if (musicRunning) return;
  musicRunning = true;
  // fade in
  musicGain!.gain.cancelScheduledValues(ctx!.currentTime);
  musicGain!.gain.setValueAtTime(musicGain!.gain.value, ctx!.currentTime);
  musicGain!.gain.linearRampToValueAtTime(0.35, ctx!.currentTime + 1.2);
  scheduleStep();
}

export function stopMusic() {
  musicRunning = false;
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
  if (ctx && musicGain) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  }
  musicNodes = [];
  stepIdx = 0;
}

export function setMusicIntensity(v: number) {
  musicIntensity = Math.max(0, Math.min(1, v));
}
