/**
 * Lightweight procedural audio using Web Audio API.
 * No external assets — pure synthesis for SFX + a soft looping ambient pad.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicNodes: { stop: () => void } | null = null;
let musicMode: "quiz" | "reveal" | null = null;

function ensureCtx(): AudioContext {
  if (!ctx) {
    const AC =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext as typeof AudioContext);
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.55;
    sfxGain.connect(masterGain);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/* ---------------- SFX ---------------- */

function blip(opts: {
  freq: number;
  type?: OscillatorType;
  duration?: number;
  attack?: number;
  release?: number;
  freqEnd?: number;
  gain?: number;
}) {
  const c = ensureCtx();
  const {
    freq,
    type = "sine",
    duration = 0.18,
    attack = 0.005,
    release = 0.12,
    freqEnd,
    gain = 0.5,
  } = opts;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
  }
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);
  osc.connect(g);
  g.connect(sfxGain!);
  osc.start(now);
  osc.stop(now + duration + release + 0.05);
}

export function sfxPop() {
  blip({ freq: 520, freqEnd: 880, type: "sine", duration: 0.08, release: 0.08, gain: 0.35 });
}

export function sfxWhoosh() {
  const c = ensureCtx();
  const now = c.currentTime;
  const bufferSize = Math.floor(c.sampleRate * 0.35);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + 0.3);
  filter.Q.value = 1.2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxGain!);
  src.start(now);
}

export function sfxChime() {
  // Magical sparkle: arpeggio
  const notes = [880, 1175, 1568, 2093]; // A5, D6, G6, C7
  notes.forEach((f, i) => {
    setTimeout(() => {
      blip({ freq: f, type: "triangle", duration: 0.4, release: 0.45, gain: 0.28 });
    }, i * 90);
  });
}

export function sfxFunny() {
  // descending boing
  blip({ freq: 600, freqEnd: 180, type: "sawtooth", duration: 0.4, release: 0.2, gain: 0.25 });
}

/* ---------------- Music ---------------- */

function startQuizMusic() {
  const c = ensureCtx();
  // Soft chord pad cycling through I - vi - IV - V (Cmaj feel)
  const chords: number[][] = [
    [261.63, 329.63, 392.0], // C E G
    [220.0, 261.63, 329.63], // A C E
    [174.61, 220.0, 261.63], // F A C
    [196.0, 246.94, 293.66], // G B D
  ];

  const oscs: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  const padGain = c.createGain();
  padGain.gain.value = 0.0001;
  padGain.connect(musicGain!);

  // fade in
  padGain.gain.exponentialRampToValueAtTime(1, c.currentTime + 1.5);

  // 3 oscillators we re-tune over time
  for (let i = 0; i < 3; i++) {
    const o = c.createOscillator();
    o.type = i === 2 ? "triangle" : "sine";
    const g = c.createGain();
    g.gain.value = 0.18;
    o.connect(g);
    g.connect(padGain);
    o.start();
    oscs.push(o);
    gains.push(g);
  }

  let idx = 0;
  const setChord = (i: number) => {
    const chord = chords[i % chords.length];
    const t = c.currentTime;
    oscs.forEach((o, j) => {
      o.frequency.cancelScheduledValues(t);
      o.frequency.setTargetAtTime(chord[j], t, 0.6);
    });
  };
  setChord(0);
  const interval = window.setInterval(() => {
    idx++;
    setChord(idx);
  }, 3500);

  // gentle bell pings on top
  const bellInterval = window.setInterval(() => {
    const chord = chords[idx % chords.length];
    const note = chord[Math.floor(Math.random() * chord.length)] * 4;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = note;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g);
    g.connect(musicGain!);
    o.start(t);
    o.stop(t + 1.5);
  }, 2200);

  return {
    stop: () => {
      window.clearInterval(interval);
      window.clearInterval(bellInterval);
      const t = c.currentTime;
      padGain.gain.cancelScheduledValues(t);
      padGain.gain.setValueAtTime(padGain.gain.value, t);
      padGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      oscs.forEach((o) => o.stop(t + 0.7));
    },
  };
}

function startRevealMusic() {
  const c = ensureCtx();
  // Brighter, wider chord
  const chord = [261.63, 392.0, 493.88, 659.25, 783.99]; // C G B E G (cmaj7add9)
  const padGain = c.createGain();
  padGain.gain.value = 0.0001;
  padGain.connect(musicGain!);
  padGain.gain.exponentialRampToValueAtTime(1, c.currentTime + 1.2);

  const oscs = chord.map((f, i) => {
    const o = c.createOscillator();
    o.type = i % 2 === 0 ? "sine" : "triangle";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = 0.07;
    o.connect(g);
    g.connect(padGain);
    o.start();
    // very slow detune for shimmer
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 0.15 + i * 0.05;
    lfoGain.gain.value = 1.5;
    lfo.connect(lfoGain);
    lfoGain.connect(o.detune);
    lfo.start();
    return { o, lfo };
  });

  return {
    stop: () => {
      const t = c.currentTime;
      padGain.gain.cancelScheduledValues(t);
      padGain.gain.setValueAtTime(padGain.gain.value, t);
      padGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      oscs.forEach(({ o, lfo }) => {
        o.stop(t + 0.7);
        lfo.stop(t + 0.7);
      });
    },
  };
}

export function startMusic(mode: "quiz" | "reveal" = "quiz") {
  ensureCtx();
  if (musicMode === mode && musicNodes) return;
  if (musicNodes) {
    musicNodes.stop();
    musicNodes = null;
  }
  musicMode = mode;
  musicNodes = mode === "quiz" ? startQuizMusic() : startRevealMusic();
}

export function stopMusic() {
  if (musicNodes) {
    musicNodes.stop();
    musicNodes = null;
    musicMode = null;
  }
}

export function setMuted(muted: boolean) {
  ensureCtx();
  if (!masterGain || !ctx) return;
  const t = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.9, t + 0.2);
}

export function vibrate(pattern: number | number[] = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}