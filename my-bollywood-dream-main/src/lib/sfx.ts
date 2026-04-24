// Simple Web Audio API powered cinematic sound effects.
// No external assets — synthesized on the fly so it works offline / instantly.

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function playWhoosh() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const noise = ac.createBufferSource();
  const buffer = ac.createBuffer(1, ac.sampleRate * 0.7, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  noise.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(3000, now + 0.5);
  filter.Q.value = 1.2;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  noise.connect(filter).connect(gain).connect(ac.destination);
  noise.start(now);
  noise.stop(now + 0.7);
}

export function playBoom() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.6, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 1.4);
}

export function playSparkle() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  [880, 1320, 1760, 2200].forEach((freq, i) => {
    const o = ac.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = ac.createGain();
    const t = now + i * 0.06;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + 0.4);
  });
}
