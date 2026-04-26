export type OutcomeKind = "positive" | "negative" | "neutral" | "rare";

export type Outcome = {
  kind: OutcomeKind;
  text: string;
  tag: string;
  subtitle?: string;
};

const POSITIVE: Outcome[] = [
  { kind: "positive", text: "You chose wisely.", tag: "Risk Taker", subtitle: "This decision changes everything — for the better." },
  { kind: "positive", text: "A door just opened.", tag: "Visionary", subtitle: "You won't see it yet. But it's there." },
  { kind: "positive", text: "The universe noticed.", tag: "Lucky One", subtitle: "Quietly, things begin to shift in your favor." },
];

const NEUTRAL: Outcome[] = [
  { kind: "neutral", text: "Nothing changes. Yet.", tag: "Safe Player", subtitle: "You're still on the same path." },
  { kind: "neutral", text: "The moment passes.", tag: "Observer", subtitle: "No bang. No whisper. Just time." },
  { kind: "neutral", text: "You stay exactly who you are.", tag: "Steady", subtitle: "For now." },
];

const NEGATIVE: Outcome[] = [
  { kind: "negative", text: "That was a mistake.", tag: "Chaotic", subtitle: "You'll think about this later. A lot." },
  { kind: "negative", text: "Interesting choice.", tag: "Reckless", subtitle: "Regret incoming." },
  { kind: "negative", text: "Something just broke.", tag: "Unlucky", subtitle: "You can't hear it yet." },
  { kind: "negative", text: "Wrong door.", tag: "Lost", subtitle: "And it locked behind you." },
];

const RARE: Outcome[] = [
  { kind: "rare", text: "You found the rare ending.", tag: "1% Soul", subtitle: "Of every thousand who clicked — only you." },
];

export function rollOutcome(): Outcome {
  const r = Math.random();
  if (r < 0.01) return RARE[0];
  if (r < 0.36) return pick(POSITIVE);
  if (r < 0.66) return pick(NEUTRAL);
  return pick(NEGATIVE);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
