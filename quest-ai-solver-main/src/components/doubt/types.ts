export type Solution = {
  answer: string;
  steps: string;
  examples: string[];
  key_points: string[];
};

export type DoubtRecord = {
  id: string;
  question: string;
  subject: string;
  level: string;
  solution: Solution;
  createdAt: number;
};

export const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "Computer Science", "General"] as const;
export const LEVELS = ["School", "College"] as const;
