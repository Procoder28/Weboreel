export const EMOJI_POOL = [
  "🔥", "⚡", "💀", "👾", "🚀", "🎮", "🎯", "💎",
  "🍕", "🍔", "🌮", "🍣", "🍩", "🍦", "🥑", "🍓",
  "🚗", "🏎️", "✈️", "🛸", "🛹", "🏁", "🛼", "⛵",
  "🐉", "🦖", "🐙", "🦄", "🦅", "🐺", "🦊", "🐸",
  "⚔️", "🛡️", "🏆", "🎲", "🃏", "🎸", "🎧", "🪐",
];

export interface LevelConfig {
  level: number;
  sequenceLength: number;
  flashMs: number;        // each image visible
  gapMs: number;          // gap between flashes
  gridSize: number;       // total tiles in recall grid
  recallSeconds: number;  // timer
}

export function getLevelConfig(level: number): LevelConfig {
  // Smooth ramp
  const sequenceLength = Math.min(3 + Math.floor((level - 1) * 0.7), 9);
  const flashMs = Math.max(900 - (level - 1) * 90, 280);
  const gapMs = Math.max(220 - (level - 1) * 20, 80);
  const gridSize = Math.min(6 + Math.floor((level - 1) / 2) * 2, 16);
  const recallSeconds = Math.max(12 - Math.floor((level - 1) / 2), 5);
  return { level, sequenceLength, flashMs, gapMs, gridSize, recallSeconds };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateRound(cfg: LevelConfig) {
  // Pick distinct emojis for the grid
  const grid = shuffle(EMOJI_POOL).slice(0, cfg.gridSize);
  // Sequence is drawn from the grid (with possible repeats only if seq > grid)
  const sequence: string[] = [];
  for (let i = 0; i < cfg.sequenceLength; i++) {
    sequence.push(grid[Math.floor(Math.random() * grid.length)]);
  }
  return { grid: shuffle(grid), sequence };
}

export function calcScore(cfg: LevelConfig, msUsed: number, correct: boolean) {
  if (!correct) return 0;
  const base = cfg.level * 100 + cfg.sequenceLength * 50;
  const speedBonus = Math.max(0, Math.floor((cfg.recallSeconds * 1000 - msUsed) / 50));
  return base + speedBonus;
}

const HS_KEY = "memory-flash-highscore";
const HL_KEY = "memory-flash-highlevel";

export function loadHighScore() {
  if (typeof window === "undefined") return { score: 0, level: 0 };
  return {
    score: Number(localStorage.getItem(HS_KEY) || 0),
    level: Number(localStorage.getItem(HL_KEY) || 0),
  };
}

export function saveHighScore(score: number, level: number) {
  if (typeof window === "undefined") return;
  const cur = loadHighScore();
  if (score > cur.score) localStorage.setItem(HS_KEY, String(score));
  if (level > cur.level) localStorage.setItem(HL_KEY, String(level));
}
