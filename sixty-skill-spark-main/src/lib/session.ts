// Anonymous session id stored in localStorage. Used to track streaks per browser.
const KEY = "skilltest.session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

const STREAK_KEY = "skilltest.streak";
const XP_KEY = "skilltest.xp";

export function getStreak(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(STREAK_KEY) ?? 0);
}

export function setStreak(n: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, String(n));
}

export function getXP(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(XP_KEY) ?? 0);
}

export function addXP(delta: number): number {
  const next = getXP() + delta;
  if (typeof window !== "undefined") localStorage.setItem(XP_KEY, String(next));
  return next;
}

export function levelFromXP(xp: number): { name: string; level: number; progress: number; nextAt: number } {
  // Tiers: every 200 xp = level. Names by band.
  const level = Math.floor(xp / 200) + 1;
  const nextAt = level * 200;
  const progress = ((xp % 200) / 200) * 100;
  let name = "Beginner";
  if (level >= 10) name = "Legend";
  else if (level >= 6) name = "Expert";
  else if (level >= 3) name = "Pro";
  else if (level >= 2) name = "Apprentice";
  return { name, level, progress, nextAt };
}
