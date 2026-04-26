// Lightweight Web Audio engine — no external assets needed.
// Generates ambient lofi pad + SFX procedurally.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicNodes: { stop: () => void } | null = null;
let muted = false;

function ensureCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.9;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(masterGain);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.9;
}
export function isMuted() {
  return muted;
}

export function startMusic() {
  const c = ensureCtx();
  if (!c || !musicGain || musicNodes) return;

  // Slow, melancholy chord pad: Am — F — C — G (lofi-ish)
  const chords: number[][] = [
    [220, 261.63, 329.63], // Am
    [174.61, 220, 261.63], // F
    [261.63, 329.63, 392], // C
    [196, 246.94, 293.66], // G
  ];

  const oscs: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 0.04;
  lfo.connect(lfoGain).connect(musicGain.gain);
  lfo.start();

  const chordGain = c.createGain();
  chordGain.gain.value = 0;
  chordGain.connect(musicGain);

  // Soft lowpass
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  chordGain.disconnect();
  chordGain.connect(filter).connect(musicGain);

  let chordIndex = 0;
  let stopped = false;

  function playChord() {
    if (stopped || !c) return;
    // fade out previous
    oscs.forEach((o) => {
      try {
        o.stop(c.currentTime + 0.5);
      } catch { /* ignore */ }
    });
    oscs.length = 0;
    gains.length = 0;

    const chord = chords[chordIndex % chords.length];
    chord.forEach((freq) => {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = c.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.18, c.currentTime + 1.2);
      osc.connect(g).connect(chordGain);
      // detune second osc for warmth
      const osc2 = c.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = freq * 2;
      osc2.detune.value = 6;
      const g2 = c.createGain();
      g2.gain.value = 0;
      g2.gain.linearRampToValueAtTime(0.05, c.currentTime + 1.2);
      osc2.connect(g2).connect(chordGain);
      osc.start();
      osc2.start();
      oscs.push(osc, osc2);
      gains.push(g, g2);
    });
    chordGain.gain.cancelScheduledValues(c.currentTime);
    chordGain.gain.linearRampToValueAtTime(0.7, c.currentTime + 1.5);

    chordIndex++;
  }

  playChord();
  const interval = setInterval(playChord, 4200);

  musicNodes = {
    stop: () => {
      stopped = true;
      clearInterval(interval);
      try {
        lfo.stop();
      } catch { /* ignore */ }
      oscs.forEach((o) => {
        try {
          o.stop();
        } catch { /* ignore */ }
      });
      musicNodes = null;
    },
  };
}

export function stopMusic() {
  musicNodes?.stop();
}

function envBeep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3) {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + dur + 0.05);
}

export function sfxTap() {
  envBeep(880, 0.08, "sine", 0.25);
  envBeep(1320, 0.06, "triangle", 0.12);
}

export function sfxWhoosh() {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 0.4);
  filter.Q.value = 2;
  const g = c.createGain();
  g.gain.value = 0.25;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
  src.connect(filter).connect(g).connect(masterGain);
  src.start();
}

export function sfxSwell() {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, c.currentTime + 1.2);
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.6);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.4);
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + 1.5);
}

export function sfxReveal() {
  // dreamy chime cluster with reverb-ish delay
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => {
    setTimeout(() => envBeep(n, 1.2, "sine", 0.18), i * 120);
    setTimeout(() => envBeep(n * 2, 0.8, "triangle", 0.06), i * 120 + 80);
  });
  // low swell
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 110;
  const g = c.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.4);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2);
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + 2.1);
}
