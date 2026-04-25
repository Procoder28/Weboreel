/**
 * Web Audio synthesis engine — no external assets, all sounds generated on the fly.
 * Provides: ambient stadium loop, whoosh, click, cheer, disappointed, hype-up.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: { stop: () => void } | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function dest(): AudioNode {
  getCtx();
  return masterGain!;
}

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.6;
}
export function isMuted() { return muted; }

/* ---------- Sound effects ---------- */

export function playWhoosh() {
  if (muted) return;
  const c = getCtx();
  const noise = c.createBufferSource();
  const buf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  noise.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2000, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.3);
  const g = c.createGain();
  g.gain.setValueAtTime(0.4, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
  noise.connect(filter); filter.connect(g); g.connect(dest());
  noise.start(); noise.stop(c.currentTime + 0.3);
}

export function playClick() {
  if (muted) return;
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(800, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.08);
  g.gain.setValueAtTime(0.3, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  o.connect(g); g.connect(dest());
  o.start(); o.stop(c.currentTime + 0.1);

  // tiny percussive snap
  const o2 = c.createOscillator();
  const g2 = c.createGain();
  o2.type = "square";
  o2.frequency.value = 1400;
  g2.gain.setValueAtTime(0.15, c.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
  o2.connect(g2); g2.connect(dest());
  o2.start(); o2.stop(c.currentTime + 0.04);
}

export function playPop() {
  if (muted) return;
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(440, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.15);
  g.gain.setValueAtTime(0.25, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  o.connect(g); g.connect(dest());
  o.start(); o.stop(c.currentTime + 0.2);
}

export function playCheer(intensity: "small" | "big" = "big") {
  if (muted) return;
  const c = getCtx();
  const dur = intensity === "big" ? 2.5 : 1.4;
  // crowd noise (filtered noise with slow swell)
  const noise = c.createBufferSource();
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.sin((i / data.length) * Math.PI);
    data[i] = (Math.random() * 2 - 1) * env * 0.7;
  }
  noise.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = intensity === "big" ? 1200 : 900;
  filter.Q.value = 0.7;
  const g = c.createGain();
  g.gain.value = intensity === "big" ? 0.5 : 0.3;
  noise.connect(filter); filter.connect(g); g.connect(dest());
  noise.start();

  // whistles
  if (intensity === "big") {
    [0.1, 0.4, 0.8, 1.3].forEach((t) => {
      const w = c.createOscillator();
      const wg = c.createGain();
      w.type = "sine";
      w.frequency.setValueAtTime(2200 + Math.random() * 400, c.currentTime + t);
      w.frequency.linearRampToValueAtTime(2800, c.currentTime + t + 0.15);
      wg.gain.setValueAtTime(0.0001, c.currentTime + t);
      wg.gain.linearRampToValueAtTime(0.15, c.currentTime + t + 0.05);
      wg.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + 0.25);
      w.connect(wg); wg.connect(dest());
      w.start(c.currentTime + t); w.stop(c.currentTime + t + 0.3);
    });
  }
}

export function playSad() {
  if (muted) return;
  const c = getCtx();
  // descending trombone-like wail
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(440, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 1.2);
  g.gain.setValueAtTime(0.001, c.currentTime);
  g.gain.linearRampToValueAtTime(0.25, c.currentTime + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.3);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  o.connect(filter); filter.connect(g); g.connect(dest());
  o.start(); o.stop(c.currentTime + 1.3);
}

export function playHype() {
  if (muted) return;
  const c = getCtx();
  // rising synth chord
  [262, 330, 392, 523].forEach((freq, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq, c.currentTime + i * 0.08);
    g.gain.setValueAtTime(0.0001, c.currentTime + i * 0.08);
    g.gain.linearRampToValueAtTime(0.15, c.currentTime + i * 0.08 + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
    o.connect(g); g.connect(dest());
    o.start(c.currentTime + i * 0.08);
    o.stop(c.currentTime + 1.3);
  });
}

/* ---------- Ambient stadium loop ---------- */

export function startAmbient() {
  if (ambientNodes) return;
  const c = getCtx();

  // Crowd ambience: low-passed noise with slow LFO
  const noise = c.createBufferSource();
  const buf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  noise.buffer = buf;
  noise.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;

  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.2;
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain); lfoGain.connect(filter.frequency);

  const noiseGain = c.createGain();
  noiseGain.gain.value = 0.18;
  noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(dest());

  // Slow drum pulse
  const drumInterval = setInterval(() => {
    if (muted) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(80, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.15);
    g.gain.setValueAtTime(0.4, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    o.connect(g); g.connect(dest());
    o.start(); o.stop(c.currentTime + 0.16);
  }, 1500);

  noise.start();
  lfo.start();

  ambientNodes = {
    stop: () => {
      try { noise.stop(); lfo.stop(); } catch {}
      clearInterval(drumInterval);
      ambientNodes = null;
    },
  };
}

export function stopAmbient() {
  ambientNodes?.stop();
}

export function boostAmbient() {
  if (masterGain) masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.85, getCtx().currentTime + 1.0);
}
