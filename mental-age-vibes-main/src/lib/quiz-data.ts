export type Choice = {
  label: string;
  emoji?: string;
  /** Mental age points contribution (higher = older mind) */
  age: number;
  /** Personality dimension contributions 0-100 */
  maturity: number;
  overthinking: number;
  chill: number;
};

export type Question = {
  id: number;
  prompt: string;
  hint?: string;
  choices: Choice[];
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    prompt: "How do you spend your weekends?",
    choices: [
      { label: "Partying", emoji: "🎉", age: 18, maturity: 20, overthinking: 30, chill: 70 },
      { label: "Relaxing", emoji: "😌", age: 32, maturity: 60, overthinking: 30, chill: 90 },
      { label: "Learning something new", emoji: "📚", age: 45, maturity: 90, overthinking: 60, chill: 40 },
      { label: "Sleeping all day", emoji: "😴", age: 22, maturity: 30, overthinking: 50, chill: 80 },
    ],
  },
  {
    id: 2,
    prompt: "Pick your default reaction:",
    choices: [
      { label: "Overthink everything", emoji: "🤯", age: 38, maturity: 70, overthinking: 95, chill: 20 },
      { label: "Go with the flow", emoji: "🌊", age: 27, maturity: 55, overthinking: 20, chill: 95 },
      { label: "Plan everything", emoji: "📅", age: 50, maturity: 95, overthinking: 70, chill: 30 },
      { label: "Panic last minute", emoji: "😅", age: 19, maturity: 25, overthinking: 80, chill: 25 },
    ],
  },
  {
    id: 3,
    prompt: "What comes next: 2, 4, 8, 16, ?",
    hint: "Quick logic check 🧠",
    choices: [
      { label: "24", emoji: "🤔", age: 20, maturity: 35, overthinking: 50, chill: 50 },
      { label: "32", emoji: "✅", age: 42, maturity: 85, overthinking: 60, chill: 60 },
      { label: "18", emoji: "😬", age: 16, maturity: 20, overthinking: 40, chill: 60 },
      { label: "20", emoji: "🫠", age: 17, maturity: 25, overthinking: 45, chill: 55 },
    ],
  },
  {
    id: 4,
    prompt: "How do you handle stress?",
    choices: [
      { label: "Ignore it", emoji: "🙈", age: 21, maturity: 25, overthinking: 30, chill: 75 },
      { label: "Talk to someone", emoji: "💬", age: 36, maturity: 80, overthinking: 50, chill: 65 },
      { label: "Make a plan", emoji: "📝", age: 48, maturity: 95, overthinking: 70, chill: 50 },
      { label: "Scroll endlessly", emoji: "📱", age: 19, maturity: 20, overthinking: 70, chill: 40 },
    ],
  },
  {
    id: 5,
    prompt: "Your ideal Friday night:",
    choices: [
      { label: "Out with friends", emoji: "🍹", age: 22, maturity: 35, overthinking: 25, chill: 75 },
      { label: "Cozy at home", emoji: "🛋️", age: 40, maturity: 75, overthinking: 50, chill: 90 },
      { label: "Side project grind", emoji: "💻", age: 47, maturity: 90, overthinking: 75, chill: 30 },
      { label: "No plans, vibes only", emoji: "✨", age: 25, maturity: 40, overthinking: 30, chill: 95 },
    ],
  },
  {
    id: 6,
    prompt: "Someone cancels on you. You feel:",
    choices: [
      { label: "Relieved tbh", emoji: "🤫", age: 38, maturity: 70, overthinking: 60, chill: 80 },
      { label: "Hurt for a sec", emoji: "🥲", age: 24, maturity: 50, overthinking: 80, chill: 40 },
      { label: "Already replanning", emoji: "🗓️", age: 44, maturity: 85, overthinking: 75, chill: 45 },
      { label: "Spiral mode 🌀", emoji: "💀", age: 17, maturity: 20, overthinking: 99, chill: 15 },
    ],
  },
  {
    id: 7,
    prompt: "Pick a guilty pleasure:",
    choices: [
      { label: "Reality TV", emoji: "📺", age: 30, maturity: 45, overthinking: 40, chill: 70 },
      { label: "3am snacks", emoji: "🍕", age: 20, maturity: 25, overthinking: 35, chill: 80 },
      { label: "Reading the news", emoji: "📰", age: 52, maturity: 95, overthinking: 80, chill: 30 },
      { label: "Buying things I don't need", emoji: "🛍️", age: 26, maturity: 40, overthinking: 55, chill: 60 },
    ],
  },
];

export type ResultType = "young" | "balanced" | "wise" | "chaos";

export type Result = {
  age: number;
  type: ResultType;
  title: string;
  emoji: string;
  description: string;
  maturity: number;
  overthinking: number;
  chill: number;
  themeClass: string;
};

const DESCRIPTIONS: Record<ResultType, string[]> = {
  wise: [
    "You think like someone way beyond your years. You probably give better advice than you actually follow.",
    "Old soul energy. You sigh at things 22-year-olds do — including, occasionally, yourself.",
    "You're basically a wise oracle in a hoodie. Tea, blanket, opinions about taxes.",
  ],
  balanced: [
    "Suspiciously well-adjusted. You feel things, then move on like a functional adult.",
    "Your inner age and outer age are roommates who get along. Rare. Beautiful.",
    "Equal parts spreadsheet and spontaneity. Your group chat trusts your decisions.",
  ],
  young: [
    "Your inner child never got the memo. Snacks, naps, vibes — that's the whole strategy.",
    "You laugh at memes during serious conversations. We respect it.",
    "Responsibility loading… 1%. Please don't restart.",
  ],
  chaos: [
    "Your brain is a group chat with 47 unread tabs. Somehow it works. Sometimes.",
    "Pure chaotic energy. You overthink everything, then act on vibes anyway.",
    "You contain multitudes. Mostly stress and snacks. Iconic.",
  ],
};

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function calculateResult(choices: Choice[]): Result {
  const n = choices.length;
  const avgAge = choices.reduce((s, c) => s + c.age, 0) / n;
  const maturity = Math.round(choices.reduce((s, c) => s + c.maturity, 0) / n);
  const overthinking = Math.round(choices.reduce((s, c) => s + c.overthinking, 0) / n);
  const chill = Math.round(choices.reduce((s, c) => s + c.chill, 0) / n);

  // Slight randomness ±3 years for replay variety
  const jitter = Math.round((Math.random() - 0.5) * 6);
  const age = Math.max(7, Math.min(90, Math.round(avgAge) + jitter));

  let type: ResultType;
  if (overthinking > 75 && chill < 45) type = "chaos";
  else if (age >= 40 && maturity >= 70) type = "wise";
  else if (age <= 25 || maturity < 40) type = "young";
  else type = "balanced";

  const meta: Record<ResultType, { title: string; emoji: string; themeClass: string }> = {
    wise: { title: "Wise Soul", emoji: "🧠", themeClass: "theme-wise" },
    balanced: { title: "Balanced Mind", emoji: "⚖️", themeClass: "theme-balanced" },
    young: { title: "Young Spirit", emoji: "🎈", themeClass: "theme-young" },
    chaos: { title: "Chaotic Energy", emoji: "💀", themeClass: "theme-chaos" },
  };

  return {
    age,
    type,
    title: meta[type].title,
    emoji: meta[type].emoji,
    themeClass: meta[type].themeClass,
    description: pick(DESCRIPTIONS[type]),
    maturity,
    overthinking,
    chill,
  };
}