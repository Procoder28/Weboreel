export type Difficulty = "easy" | "medium" | "hard";
export type ChallengeType = "mcq" | "logic" | "code-output" | "short";

export interface Challenge {
  id: string;
  type: ChallengeType;
  difficulty: Difficulty;
  prompt: string;
  // For MCQ:
  options?: string[];
  // The expected answer (kept on server, but for v1 simplicity returned to client; AI evaluates server-side anyway)
  expected?: string;
}

export interface Evaluation {
  correct: boolean;
  score: number; // 0-100
  confidence: number; // 0-100
  explanation: string;
  feedback: string; // one-line personality feedback
}
