export type Move = "rock" | "paper" | "scissors";
export type Outcome = "win" | "lose" | "draw";

export interface Round {
  id: string;
  player: Move;
  computer: Move;
  outcome: Outcome;
  at: number;
}

export interface Scores {
  player: number;
  computer: number;
  draws: number;
}