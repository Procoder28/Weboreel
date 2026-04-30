import { STARTING_HINTS } from "./levels";

export type GameState = {
  currentLevel: number; // 1-indexed; the level user is currently on
  completedLevels: number[];
  score: number;
  hintsRemaining: number;
  startedAt: number | null;
  finishedAt: number | null;
};

const KEY = "treasure-hunt-state-v1";

export const initialState = (): GameState => ({
  currentLevel: 1,
  completedLevels: [],
  score: 0,
  hintsRemaining: STARTING_HINTS,
  startedAt: null,
  finishedAt: null,
});

export function loadState(): GameState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    return { ...initialState(), ...JSON.parse(raw) };
  } catch {
    return initialState();
  }
}

export function saveState(state: GameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
