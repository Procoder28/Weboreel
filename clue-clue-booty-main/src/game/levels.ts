export type Level = {
  id: number;
  title: string;
  riddle: string;
  hint: string;
  answers: string[]; // accepted answers (lowercased)
};

export const LEVELS: Level[] = [
  {
    id: 1,
    title: "The Captain's Greeting",
    riddle: "I have seas without water, mountains without stone, cities without people, and forests without trees. What am I?",
    hint: "Pirates use me to find buried gold.",
    answers: ["map", "a map"],
  },
  {
    id: 2,
    title: "Eye of the Storm",
    riddle: "What has one eye but cannot see?",
    hint: "Sailors use it to mend their sails.",
    answers: ["needle", "a needle"],
  },
  {
    id: 3,
    title: "The Skeleton's Bounty",
    riddle: "The more you take, the more you leave behind. What am I?",
    hint: "You leave them on the sand as you walk.",
    answers: ["footsteps", "footprints", "steps"],
  },
  {
    id: 4,
    title: "Whispers of the Deep",
    riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind.",
    hint: "You hear me bouncing off cliffs.",
    answers: ["echo", "an echo"],
  },
  {
    id: 5,
    title: "The Cursed Coin",
    riddle: "What has a head and a tail but no body?",
    hint: "Toss me to decide your fate, matey.",
    answers: ["coin", "a coin"],
  },
  {
    id: 6,
    title: "Kraken's Riddle",
    riddle: "I am taken from a mine, and shut up in a wooden case, from which I am never released, and yet I am used by almost everyone. What am I?",
    hint: "You write with me.",
    answers: ["pencil", "a pencil", "pencil lead"],
  },
  {
    id: 7,
    title: "Davy Jones' Locker",
    riddle: "What can travel around the world while staying in a corner?",
    hint: "Stuck on an envelope.",
    answers: ["stamp", "a stamp", "postage stamp"],
  },
  {
    id: 8,
    title: "The Black Pearl",
    riddle: "I'm tall when I'm young, and short when I'm old. What am I?",
    hint: "I melt as I burn.",
    answers: ["candle", "a candle"],
  },
  {
    id: 9,
    title: "Siren's Song",
    riddle: "What gets wetter the more it dries?",
    hint: "Hangs in the captain's quarters after a swim.",
    answers: ["towel", "a towel"],
  },
  {
    id: 10,
    title: "The Final Treasure",
    riddle: "I have keys but no locks. I have space but no room. You can enter, but can't go outside. What am I?",
    hint: "You're touching one right now to type.",
    answers: ["keyboard", "a keyboard"],
  },
];

export const TOTAL_LEVELS = LEVELS.length;
export const STARTING_HINTS = 3;
