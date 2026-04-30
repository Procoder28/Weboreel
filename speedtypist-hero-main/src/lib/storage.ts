export type Attempt = {
  id: string;
  date: number;
  duration: number; // seconds
  wpm: number;
  accuracy: number; // 0-100
  mistakes: number;
  charsTyped: number;
};

const KEY = "typerush.attempts.v1";

export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Attempt[];
  } catch {
    return [];
  }
}

export function saveAttempt(a: Attempt): Attempt[] {
  const list = loadAttempts();
  const next = [a, ...list].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearAttempts() {
  localStorage.removeItem(KEY);
}
