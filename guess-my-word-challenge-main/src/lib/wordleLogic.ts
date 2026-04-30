export type LetterStatus = "correct" | "present" | "absent" | "empty";

export function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const result: LetterStatus[] = Array(5).fill("absent");
  const answerArr = answer.split("");
  const guessArr = guess.split("");
  const used = Array(5).fill(false);

  // First pass: greens
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  // Second pass: yellows
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessArr[i] === answerArr[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

export type Stats = {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  guessDistribution: number[]; // length 6
};

export const defaultStats: Stats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0],
};

const STATS_KEY = "wordguess_stats_v1";

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...defaultStats };
    const parsed = JSON.parse(raw);
    return { ...defaultStats, ...parsed };
  } catch {
    return { ...defaultStats };
  }
}

export function saveStats(stats: Stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordResult(won: boolean, attempts: number): Stats {
  const stats = loadStats();
  stats.played += 1;
  if (won) {
    stats.wins += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    if (attempts >= 1 && attempts <= 6) stats.guessDistribution[attempts - 1] += 1;
  } else {
    stats.currentStreak = 0;
  }
  saveStats(stats);
  return stats;
}
