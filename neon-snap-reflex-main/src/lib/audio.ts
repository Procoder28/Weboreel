// Lightweight WebAudio engine for arcade music + SFX (no external assets).

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

let musicTimer: number | null = null;
let musicStep = 0;
let musicBpm = 128;
let musicRunning = false;
let muted = false;

function ac(): AudioContext {
  if (!ctx) {
    const Ctor =
      (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.35;
    musicGain.connect(masterGain);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);
  }
  return ctx;
}

export async function initAudio() {
  const c = ac();
  if (c.state === "suspended") await c.resume();
}

export function setMuted(v: boolean) {
  muted = v;
  if (masterGain) masterGain.gain.value = v ? 0 : 0.9;
}

export function isMuted() {
  return muted;
}

function envTone(freq: number, dur: number, type: OscillatorType, vol = 0.4, sweepTo?: number) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (sweepTo !== undefined) {
    o.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), c.currentTime + dur);
  }
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g);
  g.connect(sfxGain!);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

function noiseBurst(dur: number, vol = 0.3, hp = 800) {
  const c = ac();
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxGain!);
  src.start();
}

export const sfx = {
  tick: () => envTone(2200, 0.04, "square", 0.08),
  correct: () => {
    envTone(880, 0.08, "triangle", 0.35);
    envTone(1320, 0.12, "triangle", 0.25);
  },
  wrong: () => {
    envTone(180, 0.25, "sawtooth", 0.45, 80);
    noiseBurst(0.15, 0.2, 400);
  },
  miss: () => envTone(120, 0.25, "sine", 0.4, 60),
  combo: (n: number) => {
    const base = 440 + Math.min(n, 20) * 40;
    envTone(base, 0.12, "triangle", 0.35);
    envTone(base * 1.5, 0.15, "triangle", 0.25);
  },
  gameOver: () => {
    envTone(440, 0.6, "sawtooth", 0.4, 80);
    setTimeout(() => envTone(220, 0.8, "sawtooth", 0.35, 50), 200);
    setTimeout(() => noiseBurst(0.5, 0.2, 200), 400);
  },
  start: () => {
    envTone(660, 0.1, "square", 0.3);
    setTimeout(() => envTone(880, 0.1, "square", 0.3), 90);
    setTimeout(() => envTone(1320, 0.15, "square", 0.35), 180);
  },
};

// Simple looping arcade beat: kick + hat + bass arpeggio
const bassPattern = [110, 110, 165, 110, 138, 110, 165, 220];

function playStep() {
  if (!musicRunning) return;
  const c = ac();
  const step = musicStep % 8;

  // kick on every beat
  if (step % 2 === 0) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(120, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.18);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.7, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.2);
    o.connect(g);
    g.connect(musicGain!);
    o.start();
    o.stop(c.currentTime + 0.22);
  }

  // hat on off-beats
  if (step % 2 === 1) {
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 6000;
    const g = c.createGain();
    g.gain.value = 0.25;
    src.connect(f);
    f.connect(g);
    g.connect(musicGain!);
    src.start();
  }

  // bass arp
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.value = bassPattern[step];
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 900;
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.22, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
  o.connect(f);
  f.connect(g);
  g.connect(musicGain!);
  o.start();
  o.stop(c.currentTime + 0.2);

  musicStep++;
  const interval = 60000 / musicBpm / 2; // 8th notes
  musicTimer = window.setTimeout(playStep, interval);
}

export function startMusic(bpm = 128) {
  if (musicRunning) return;
  ac();
  musicBpm = bpm;
  musicRunning = true;
  musicStep = 0;
  playStep();
}

export function setMusicBpm(bpm: number) {
  musicBpm = Math.min(200, Math.max(80, bpm));
}

export function stopMusic() {
  musicRunning = false;
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}
