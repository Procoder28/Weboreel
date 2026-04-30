export type Category = "science" | "tech" | "gk" | "movies" | "sports";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  q: string;
  options: string[];
  answer: number; // index
}

export interface QuizConfig {
  category: Category;
  difficulty: Difficulty;
  playerName: string;
}

export interface QuizResult {
  score: number;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
  category: Category;
  difficulty: Difficulty;
  playerName: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  category: Category;
  difficulty: Difficulty;
  accuracy: number;
}

export const CATEGORIES: { id: Category; label: string; emoji: string; blurb: string }[] = [
  { id: "science", label: "Science", emoji: "🧪", blurb: "Atoms, biology, the cosmos" },
  { id: "tech", label: "Technology", emoji: "💻", blurb: "Code, gadgets, the web" },
  { id: "gk", label: "General Knowledge", emoji: "🌍", blurb: "A bit of everything" },
  { id: "movies", label: "Movies", emoji: "🎬", blurb: "Cinema classics & blockbusters" },
  { id: "sports", label: "Sports", emoji: "🏆", blurb: "Goals, records, legends" },
];

export const DIFFICULTIES: { id: Difficulty; label: string; desc: string; multiplier: string }[] = [
  { id: "easy", label: "Easy", desc: "Warm up your neurons", multiplier: "Casual pace" },
  { id: "medium", label: "Medium", desc: "A real challenge", multiplier: "Sharper questions" },
  { id: "hard", label: "Hard", desc: "Only for masters", multiplier: "Expert territory" },
];