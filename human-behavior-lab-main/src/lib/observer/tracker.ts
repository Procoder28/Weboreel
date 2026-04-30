// Behavior tracking: cursor velocity, hesitation, scroll, clicks, idle.

export type Metrics = {
  cursorVelocity: number;       // px/sec smoothed
  totalDistance: number;
  circleScore: number;          // accumulates when moving in circles
  hesitationMs: number;         // current pause length
  totalIdleMs: number;
  scrollSpeed: number;
  totalScroll: number;
  rapidClicks: number;
  totalClicks: number;
  doubleClicks: number;
  hoverDurationMs: number;
  visitedAt: number;
  lastInteractionAt: number;
  patternSeekScore: number;     // hovers same area repeatedly
  fastScrollEvents: number;
};

export const initialMetrics: Metrics = {
  cursorVelocity: 0,
  totalDistance: 0,
  circleScore: 0,
  hesitationMs: 0,
  totalIdleMs: 0,
  scrollSpeed: 0,
  totalScroll: 0,
  rapidClicks: 0,
  totalClicks: 0,
  doubleClicks: 0,
  hoverDurationMs: 0,
  visitedAt: Date.now(),
  lastInteractionAt: Date.now(),
  patternSeekScore: 0,
  fastScrollEvents: 0,
};

export type ProfileType =
  | "The Observer"
  | "The Escaper"
  | "The Pattern Seeker"
  | "The Impatient Mind"
  | "The Hesitator";

export function classifyProfile(m: Metrics): { type: ProfileType; description: string } {
  if (m.rapidClicks > 6 || m.cursorVelocity > 1500) {
    return {
      type: "The Impatient Mind",
      description: "You rush through uncertainty. Your hands move faster than your thoughts.",
    };
  }
  if (m.fastScrollEvents > 5 && m.hoverDurationMs < 4000) {
    return {
      type: "The Escaper",
      description: "You skim. You skip. You avoid the parts that feel uncomfortable.",
    };
  }
  if (m.circleScore > 80 || m.patternSeekScore > 6) {
    return {
      type: "The Pattern Seeker",
      description: "You search for meaning in everything — even where there is none.",
    };
  }
  if (m.totalIdleMs > 12000 || m.hesitationMs > 5000) {
    return {
      type: "The Hesitator",
      description: "You pause before deciding. You weigh things others ignore.",
    };
  }
  return {
    type: "The Observer",
    description: "Slow. Curious. Analytical. You watch as much as you are watched.",
  };
}