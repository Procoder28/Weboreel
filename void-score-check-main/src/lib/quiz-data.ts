export type Answer = { text: string; emoji: string; weight: number };
export type Question = { id: number; text: string; vibe?: "deep" | "normal"; answers: Answer[] };

export const questions: Question[] = [
  {
    id: 1,
    text: "How often do you question your life choices?",
    answers: [
      { text: "Never", emoji: "😌", weight: 0 },
      { text: "Sometimes", emoji: "🤔", weight: 1 },
      { text: "Often", emoji: "😅", weight: 2 },
      { text: "Constantly", emoji: "💀", weight: 3 },
    ],
  },
  {
    id: 2,
    text: "What do you think about at 3AM?",
    vibe: "deep",
    answers: [
      { text: "Nothing, I sleep peacefully", emoji: "😴", weight: 0 },
      { text: "Random stuff", emoji: "🌀", weight: 1 },
      { text: "My future", emoji: "🔮", weight: 2 },
      { text: "Everything at once", emoji: "🌌", weight: 3 },
    ],
  },
  {
    id: 3,
    text: "If life had a meaning, would you...",
    answers: [
      { text: "Find it", emoji: "🧭", weight: 0 },
      { text: "Ignore it", emoji: "🙈", weight: 1 },
      { text: "Overthink it", emoji: "🤯", weight: 3 },
      { text: "Make memes about it", emoji: "🥲", weight: 2 },
    ],
  },
  {
    id: 4,
    text: "Your current vibe:",
    answers: [
      { text: "Thriving", emoji: "✨", weight: 0 },
      { text: "Surviving", emoji: "😐", weight: 1 },
      { text: "Confused", emoji: "😵", weight: 2 },
      { text: "Existential", emoji: "😶‍🌫️", weight: 3 },
    ],
  },
  {
    id: 5,
    text: "How do you handle silence?",
    vibe: "deep",
    answers: [
      { text: "Love it, peaceful", emoji: "🕊️", weight: 0 },
      { text: "It's okay", emoji: "🌿", weight: 1 },
      { text: "Need background noise", emoji: "🎧", weight: 2 },
      { text: "It's deafening", emoji: "🌑", weight: 3 },
    ],
  },
  {
    id: 6,
    text: "When someone asks 'how are you?'",
    answers: [
      { text: "Genuinely good", emoji: "🌞", weight: 0 },
      { text: "Just say 'fine'", emoji: "🙃", weight: 2 },
      { text: "Internally screaming", emoji: "😬", weight: 3 },
      { text: "Depends on the day", emoji: "🌗", weight: 1 },
    ],
  },
  {
    id: 7,
    text: "Pick your spirit object:",
    answers: [
      { text: "A sunbeam", emoji: "☀️", weight: 0 },
      { text: "Lukewarm coffee", emoji: "☕", weight: 1 },
      { text: "An unread message", emoji: "📩", weight: 2 },
      { text: "The void", emoji: "🕳️", weight: 3 },
    ],
  },
];

export type ResultTier = {
  level: "Low" | "Medium" | "High" | "Extreme";
  title: string;
  emoji: string;
  description: string;
  bg: string;
};

export function getResult(scorePct: number): ResultTier {
  if (scorePct < 30)
    return {
      level: "Low",
      title: "Chill Human",
      emoji: "😎",
      description:
        "You're doing fine… suspiciously fine. Either you've figured life out or you're in denial — honestly, either works.",
      bg: "bg-cosmic",
    };
  if (scorePct < 60)
    return {
      level: "Medium",
      title: "Overthinker",
      emoji: "🤯",
      description:
        "You think too much, but at least you're aware. You replay conversations from 2014 like they happened yesterday — it's a gift, kind of.",
      bg: "bg-cosmic",
    };
  if (scorePct < 85)
    return {
      level: "High",
      title: "Philosopher Mode",
      emoji: "🧠",
      description:
        "You've unlocked late-night thoughts. You've probably had at least one 3AM crisis this week. Don't worry, you're not alone… unfortunately.",
      bg: "bg-void",
    };
  return {
    level: "Extreme",
    title: "Void Certified",
    emoji: "💀",
    description:
      "You stare into the abyss… and it replies. At this point you and the void are on a first-name basis. Maybe try sunlight?",
    bg: "bg-glitch",
  };
}

const voidAdvice = [
  "Drink water. The void can wait.",
  "You don't have to figure it all out tonight.",
  "Existence is a group project. You're not failing alone.",
  "Touch grass — it's surprisingly grounding.",
  "Your thoughts are loud, but they're not always right.",
  "The universe is vast. Your problems are tiny. This is comforting, somehow.",
];

export function randomAdvice() {
  return voidAdvice[Math.floor(Math.random() * voidAdvice.length)];
}
