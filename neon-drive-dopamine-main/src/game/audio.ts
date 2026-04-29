// Procedural synthwave audio engine using Web Audio API.
// No external assets required — keeps the game lightweight and instant.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicNodes: { stop: () => void } | null = null;
let musicIntensity = 0;

export function initAudio() {
  if (ctx) return ctx;
  const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.35;
  musicGain.connect(masterGain);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.6;
  sfxGain.connect(masterGain);
  return ctx;
}

export async function resumeAudio() {
  const c = initAudio();
  if (c.state === "suspended") await c.resume();
}

function now() { return ctx!.currentTime; }

// ---------- SFX ----------
export function sfxLaneSwitch() {
  if (!ctx || !sfxGain) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(800, now());
  o.frequency.exponentialRampToValueAtTime(300, now() + 0.15);
  g.gain.setValueAtTime(0.25, now());
  g.gain.exponentialRampToValueAtTime(0.001, now() + 0.15);
  o.connect(g).connect(sfxGain);
  o.start(); o.stop(now() + 0.16);
}

export function sfxNearMiss() {
  if (!ctx || !sfxGain) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(1200, now());
  o.frequency.exponentialRampToValueAtTime(1800, now() + 0.12);
  g.gain.setValueAtTime(0.18, now());
  g.gain.exponentialRampToValueAtTime(0.001, now() + 0.18);
  o.connect(g).connect(sfxGain);
  o.start(); o.stop(now() + 0.2);
}

export function sfxCrash() {
  if (!ctx || !sfxGain) return;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;
  const g = ctx.createGain();
  g.gain.value = 0.7;
  src.connect(filter).connect(g).connect(sfxGain);
  src.start();

  // bass drop
  const o = ctx.createOscillator();
  const og = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(180, now());
  o.frequency.exponentialRampToValueAtTime(30, now() + 0.8);
  og.gain.setValueAtTime(0.5, now());
  og.gain.exponentialRampToValueAtTime(0.001, now() + 0.8);
  o.connect(og).connect(sfxGain);
  o.start(); o.stop(now() + 0.85);
}

export function sfxBoost() {
  if (!ctx || !sfxGain) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(200, now());
  o.frequency.exponentialRampToValueAtTime(1500, now() + 0.5);
  g.gain.setValueAtTime(0.3, now());
  g.gain.exponentialRampToValueAtTime(0.001, now() + 0.5);
  o.connect(g).connect(sfxGain);
  o.start(); o.stop(now() + 0.55);
}

export function sfxCountdown(final = false) {
  if (!ctx || !sfxGain) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.value = final ? 880 : 440;
  g.gain.setValueAtTime(0.25, now());
  g.gain.exponentialRampToValueAtTime(0.001, now() + (final ? 0.4 : 0.15));
  o.connect(g).connect(sfxGain);
  o.start(); o.stop(now() + (final ? 0.42 : 0.18));
}

// ---------- Music ----------
// Simple looping synthwave bassline + arp + drums. Intensity 0..1 controls layers.
export function startMusic() {
  if (!ctx || !musicGain || musicNodes) return;
  const c = ctx;
  const out = musicGain;

  const bassNotes = [55, 55, 82.4, 73.4]; // A1, A1, E2, D2
  const arpNotes = [220, 277.18, 329.63, 440, 329.63, 277.18];
  const beat = 0.25; // seconds per 16th
  let step = 0;
  let stopped = false;

  const drumGain = c.createGain();
  drumGain.gain.value = 0.0;
  drumGain.connect(out);
  const arpGain = c.createGain();
  arpGain.gain.value = 0.0;
  arpGain.connect(out);
  const bassGain = c.createGain();
  bassGain.gain.value = 0.5;
  bassGain.connect(out);

  const tick = () => {
    if (stopped || !ctx) return;
    const t = ctx.currentTime;

    // Bass on every beat
    if (step % 4 === 0) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sawtooth";
      o.frequency.value = bassNotes[(step / 4) % bassNotes.length];
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 400 + musicIntensity * 1200;
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.4, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + beat * 3.5);
      o.connect(f).connect(g).connect(bassGain);
      o.start(t); o.stop(t + beat * 4);
    }

    // Arp every 16th once intensity > 0.2
    if (musicIntensity > 0.2) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "square";
      o.frequency.value = arpNotes[step % arpNotes.length] * 2;
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.9);
      o.connect(g).connect(arpGain);
      o.start(t); o.stop(t + beat);
    }
    arpGain.gain.setTargetAtTime(Math.max(0, (musicIntensity - 0.2) * 0.6), t, 0.3);

    // Kick on 1 and 3, snare-ish on 2 and 4 — when intensity > 0.4
    if (musicIntensity > 0.4) {
      if (step % 8 === 0 || step % 8 === 4) {
        // kick
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        g.gain.setValueAtTime(0.6, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g).connect(drumGain);
        o.start(t); o.stop(t + 0.2);
      }
      if (step % 8 === 2 || step % 8 === 6) {
        // hat / snare noise
        const buf = c.createBuffer(1, c.sampleRate * 0.1, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = c.createBufferSource();
        src.buffer = buf;
        const f = c.createBiquadFilter();
        f.type = "highpass"; f.frequency.value = 4000;
        const g = c.createGain();
        g.gain.value = 0.25;
        src.connect(f).connect(g).connect(drumGain);
        src.start(t);
      }
    }
    drumGain.gain.setTargetAtTime(Math.max(0, (musicIntensity - 0.4) * 1.2), t, 0.4);

    step++;
  };

  // schedule via interval — beat is forgiving (250ms)
  const interval = window.setInterval(tick, beat * 1000);
  tick();

  musicNodes = {
    stop: () => {
      stopped = true;
      window.clearInterval(interval);
      try { drumGain.disconnect(); arpGain.disconnect(); bassGain.disconnect(); } catch { /* noop */ }
      musicNodes = null;
    },
  };
}

export function setMusicIntensity(v: number) {
  musicIntensity = Math.max(0, Math.min(1, v));
}

export function stopMusic() {
  musicNodes?.stop();
  musicNodes = null;
}