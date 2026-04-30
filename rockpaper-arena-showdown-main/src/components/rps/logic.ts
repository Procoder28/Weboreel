import type { Move, Outcome } from "./types";

export const MOVES: Move[] = ["rock", "paper", "scissors"];

export function randomMove(): Move {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

export function decide(player: Move, computer: Move): Outcome {
  if (player === computer) return "draw";
  if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) {
    return "win";
  }
  return "lose";
}

export const MOVE_EMOJI: Record<Move, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

export const MOVE_LABEL: Record<Move, string> = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
};