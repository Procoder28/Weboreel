import type { Difficulty, Challenge, Evaluation } from "./types";

const KEY = "skilltest.lastResult";

export interface RoundResult {
  challenge: Challenge;
  evaluation: Evaluation;
  userAnswer: string;
  timeTakenMs: number;
  difficulty: Difficulty;
  percentile: number;
  totalAttempts: number;
  xpEarned: number;
  streak: number;
}

export function saveResult(r: RoundResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(r));
}

export function loadResult(): RoundResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoundResult;
  } catch {
    return null;
  }
}

export function clearResult() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
