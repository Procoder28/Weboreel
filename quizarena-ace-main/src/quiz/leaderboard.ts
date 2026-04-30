import { LeaderboardEntry } from "./types";

const KEY = "quizmaster.leaderboard.v1";

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const list = getLeaderboard();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function clearLeaderboard() {
  localStorage.removeItem(KEY);
}