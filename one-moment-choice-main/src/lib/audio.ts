// Lightweight WebAudio engine — no external assets required.
// Generates ambient hum, heartbeat pulses, and impact stings procedurally.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let humNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let heartbeatTimer: number | null = null;
let heartbeatBpm = 60;
let heartbeatGain = 0.0;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
  }
  return ctx!;
}

export async function initAudio() {
  const c = getCtx();
  if (c.state === "suspended") await c.resume();
}

export function startAmbient() {
  const c = getCtx();
  if (humNodes.length) return;
  // Two detuned low oscillators for a deep cinematic hum
  [40, 55, 82].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = i === 2 ? "triangle" : "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain).connect(masterGain!);
    osc.start();
    // Fade in
    gain.gain.linearRampToValueAtTime(i === 2 ? 0.04 : 0.09, c.currentTime + 2);
    humNodes.push({ osc, gain });
  });
}

export function stopAmbient(fadeMs = 400) {
  const c = getCtx();
  humNodes.forEach(({ osc, gain }) => {
    gain.gain.cancelScheduledValues(c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + fadeMs / 1000);
    osc.stop(c.currentTime + fadeMs / 1000 + 0.05);
  });
  humNodes = [];
}

function playHeartbeatThump() {
  const c = getCtx();
  const dest = masterGain;
  if (!dest) return;
  const now = c.currentTime;
  // Two thumps: lub-dub
  [0, 0.13].forEach((offset, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(70, now + offset);
    osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.18);
    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(heartbeatGain * (i === 0 ? 1 : 0.7), now + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
    osc.connect(gain).connect(dest);
    osc.start(now + offset);
    osc.stop(now + offset + 0.25);
  });
}

export function startHeartbeat(bpm = 60, volume = 0.25) {
  heartbeatBpm = bpm;
  heartbeatGain = volume;
  if (heartbeatTimer != null) return;
  const tick = () => {
    playHeartbeatThump();
    heartbeatTimer = window.setTimeout(tick, (60 / heartbeatBpm) * 1000);
  };
  tick();
}

export function setHeartbeatIntensity(bpm: number, volume: number) {
  heartbeatBpm = bpm;
  heartbeatGain = volume;
}

export function stopHeartbeat() {
  if (heartbeatTimer != null) {
    clearTimeout(heartbeatTimer);
    heartbeatTimer = null;
  }
  heartbeatGain = 0;
}

export function silence() {
  stopHeartbeat();
  stopAmbient(80);
}

export function playImpact(kind: "positive" | "negative" | "neutral" | "rare") {
  const c = getCtx();
  if (!masterGain) return;
  const now = c.currentTime;

  if (kind === "negative") {
    // Deep bass drop
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.6);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    osc.connect(filter).connect(gain).connect(masterGain);
    osc.start(now);
    osc.stop(now + 2.3);
  } else if (kind === "positive") {
    // Uplifting chord
    [261.63, 392, 523.25, 659.25].forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.2 + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3);
      osc.connect(gain).connect(masterGain!);
      osc.start(now + i * 0.05);
      osc.stop(now + 3.1);
    });
  } else if (kind === "rare") {
    // Shimmering bell
    [880, 1320, 1760, 2200].forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 2.5);
      osc.connect(gain).connect(masterGain!);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 2.6);
    });
  } else {
    // Neutral — soft pad
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    osc.connect(gain).connect(masterGain);
    osc.start(now);
    osc.stop(now + 2.5);
  }
}

export function playClick() {
  const c = getCtx();
  if (!masterGain) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain).connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.13);
}
