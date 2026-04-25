// Lightweight WebAudio sound generator - no assets needed
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function unlockAudio() {
  getCtx();
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export function playBoing() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, c.currentTime + 0.12);
  osc.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.22);
  g.gain.setValueAtTime(0.18, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.26);
}

export function playPop() {
  tone(660, 0.08, "triangle", 0.2);
  setTimeout(() => tone(990, 0.06, "triangle", 0.15), 40);
}

export function playMagic() {
  [440, 660, 880, 1100].forEach((f, i) =>
    setTimeout(() => tone(f, 0.18, "sine", 0.12), i * 90)
  );
}
