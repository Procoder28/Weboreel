export type ColorKey = "red" | "blue" | "green" | "yellow" | "purple" | "pink" | "cyan";

export const COLOR_META: Record<ColorKey, { label: string; var: string; emoji: string }> = {
  red:    { label: "RED",    var: "var(--neon-red)",    emoji: "🔴" },
  blue:   { label: "BLUE",   var: "var(--neon-blue)",   emoji: "🔵" },
  green:  { label: "GREEN",  var: "var(--neon-green)",  emoji: "🟢" },
  yellow: { label: "YELLOW", var: "var(--neon-yellow)", emoji: "🟡" },
  purple: { label: "PURPLE", var: "var(--neon-purple)", emoji: "🟣" },
  pink:   { label: "PINK",   var: "var(--neon-pink)",   emoji: "🩷" },
  cyan:   { label: "CYAN",   var: "var(--neon-cyan)",   emoji: "🩵" },
};

export type GameMode = "classic" | "timeattack" | "hardcore";

export interface ModeConfig {
  id: GameMode;
  name: string;
  tagline: string;
  duration?: number;     // seconds, time-attack
  startInterval: number; // ms between flashes
  minInterval: number;
  speedUpEvery: number;  // every N correct taps
  speedUpAmount: number; // ms
  endOnMistake: boolean;
  startLives: number;
}

export const MODES: Record<GameMode, ModeConfig> = {
  classic: {
    id: "classic",
    name: "Classic",
    tagline: "3 lives. Survive.",
    startInterval: 750,
    minInterval: 320,
    speedUpEvery: 4,
    speedUpAmount: 25,
    endOnMistake: false,
    startLives: 3,
  },
  timeattack: {
    id: "timeattack",
    name: "Time Attack",
    tagline: "60 seconds. Max score.",
    duration: 60,
    startInterval: 700,
    minInterval: 280,
    speedUpEvery: 5,
    speedUpAmount: 20,
    endOnMistake: false,
    startLives: 99,
  },
  hardcore: {
    id: "hardcore",
    name: "Hardcore",
    tagline: "One mistake = game over 💀",
    startInterval: 600,
    minInterval: 220,
    speedUpEvery: 3,
    speedUpAmount: 30,
    endOnMistake: true,
    startLives: 1,
  },
};

const HIGH_SCORE_KEY = "color-reflex-highscores";

export function getHighScore(mode: GameMode): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed[mode] ?? 0;
  } catch {
    return 0;
  }
}

export function setHighScore(mode: GameMode, score: number) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    const parsed = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    if (score > (parsed[mode] ?? 0)) {
      parsed[mode] = score;
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
