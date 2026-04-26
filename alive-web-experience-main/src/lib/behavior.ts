export type BehaviorStats = {
  clicks: number;
  hovers: number;
  scrolls: number;
  avgClickGap: number; // ms
  fastClicks: number; // <300ms gap
  hesitations: number; // >3000ms gap
  startTime: number;
};

export const initialStats = (): BehaviorStats => ({
  clicks: 0,
  hovers: 0,
  scrolls: 0,
  avgClickGap: 0,
  fastClicks: 0,
  hesitations: 0,
  startTime: Date.now(),
});

export function describePace(s: BehaviorStats): "fast" | "slow" | "normal" {
  if (s.clicks < 3) return "normal";
  if (s.fastClicks > s.clicks * 0.5) return "fast";
  if (s.hesitations > s.clicks * 0.4) return "slow";
  return "normal";
}
