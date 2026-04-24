// Web Audio synthesized SFX — no asset files needed.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

let muted = false;
export function setMuted(v: boolean) {
  muted = v;
  if (typeof window !== "undefined") localStorage.setItem("skilltest.muted", v ? "1" : "0");
}
export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("skilltest.muted") === "1") muted = true;
  return muted;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.08) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + duration + 0.02);
}

export const sfx = {
  tick: () => tone(880, 0.06, "square", 0.04),
  urgent: () => tone(1320, 0.08, "square", 0.06),
  submit: () => {
    tone(520, 0.1, "triangle", 0.07);
    setTimeout(() => tone(780, 0.12, "triangle", 0.07), 60);
  },
  success: () => {
    tone(660, 0.12, "sine", 0.08);
    setTimeout(() => tone(880, 0.12, "sine", 0.08), 90);
    setTimeout(() => tone(1320, 0.2, "sine", 0.09), 180);
  },
  fail: () => {
    tone(280, 0.18, "sawtooth", 0.06);
    setTimeout(() => tone(180, 0.25, "sawtooth", 0.06), 120);
  },
  start: () => {
    tone(440, 0.08, "triangle", 0.06);
    setTimeout(() => tone(660, 0.12, "triangle", 0.07), 70);
  },
};
