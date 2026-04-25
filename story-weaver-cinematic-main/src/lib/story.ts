import sceneTitle from "@/assets/scene-title.jpg";
import sceneStreet from "@/assets/scene-street.jpg";
import sceneDoor from "@/assets/scene-door.jpg";
import sceneStudy from "@/assets/scene-study.jpg";
import sceneAlley from "@/assets/scene-alley.jpg";
import sceneMirror from "@/assets/scene-mirror.jpg";
import sceneDawn from "@/assets/scene-dawn.jpg";

export type Mood = "calm" | "suspense" | "intense" | "dread" | "hope";

export type Choice = {
  label: string;
  to: string;
  hint?: string;
};

export type Ending = {
  kind: "good" | "bad" | "twist";
  title: string;
  epitaph: string;
};

export type Scene = {
  id: string;
  image: string;
  mood: Mood;
  chapter: string;
  narration: string[];
  choices?: Choice[];
  ending?: Ending;
};

export const STORY: Record<string, Scene> = {
  start: {
    id: "start",
    image: sceneStreet,
    mood: "suspense",
    chapter: "Chapter I — The Letter",
    narration: [
      "Rain bleeds down the cobblestones of Marlow Street.",
      "An envelope waits in your coat pocket. No name. No return address.",
      "Only an hour, an address, and a single line: ‘Come alone, or never know.’",
    ],
    choices: [
      { label: "Open the letter again", to: "letter", hint: "Read every word" },
      { label: "Walk to the address", to: "door", hint: "Trust the stranger" },
      { label: "Disappear into the alley", to: "alley", hint: "Vanish from the night" },
    ],
  },

  letter: {
    id: "letter",
    image: sceneStreet,
    mood: "suspense",
    chapter: "Chapter I — The Letter",
    narration: [
      "The paper is warm — as if it remembers a hand that wrote it minutes ago.",
      "Beneath the ink, a faint sketch: a door with a brass knocker shaped like a wolf.",
      "You know that door. You shouldn't.",
    ],
    choices: [
      { label: "Go to the door", to: "door" },
      { label: "Slip into the alley", to: "alley" },
    ],
  },

  door: {
    id: "door",
    image: sceneDoor,
    mood: "dread",
    chapter: "Chapter II — The Threshold",
    narration: [
      "The wolf's brass eyes catch the streetlight.",
      "From inside: the slow creak of floorboards. Someone is waiting.",
      "Your hand hovers above the knocker.",
    ],
    choices: [
      { label: "Knock three times", to: "study", hint: "Announce yourself" },
      { label: "Try the handle quietly", to: "study", hint: "Slip in unseen" },
      { label: "Step back. Run.", to: "alley_late", hint: "Save yourself" },
    ],
  },

  alley: {
    id: "alley",
    image: sceneAlley,
    mood: "intense",
    chapter: "Chapter II — The Vanishing",
    narration: [
      "The neon sign hums a sickly red. Steam coils from a grate.",
      "A figure stands at the alley's end, hat low, arms loose at his sides.",
      "He has been waiting longer than you've been alive.",
    ],
    choices: [
      { label: "Approach the stranger", to: "mirror" },
      { label: "Turn back to the door", to: "door" },
    ],
  },

  alley_late: {
    id: "alley_late",
    image: sceneAlley,
    mood: "intense",
    chapter: "Chapter III — The Chase",
    narration: [
      "You run. Footsteps follow — too patient to be panicked.",
      "The alley narrows into a wall of brick and old posters.",
      "There is nowhere left, and the footsteps have stopped.",
    ],
    ending: {
      kind: "bad",
      title: "Your story ends here",
      epitaph: "The street kept your secret. It keeps them all.",
    },
  },

  study: {
    id: "study",
    image: sceneStudy,
    mood: "suspense",
    chapter: "Chapter III — The Study",
    narration: [
      "A lamp burns low over a desk that hasn't been dusted in twenty years.",
      "An old telephone rests off its cradle, the line buzzing softly.",
      "On the desk: your name, written in your own handwriting.",
    ],
    choices: [
      { label: "Pick up the phone", to: "mirror", hint: "Listen to the voice" },
      { label: "Read the letter on the desk", to: "dawn_good", hint: "Learn the truth" },
      { label: "Leave. Now.", to: "alley_late" },
    ],
  },

  mirror: {
    id: "mirror",
    image: sceneMirror,
    mood: "dread",
    chapter: "Chapter IV — The Mirror",
    narration: [
      "Candlelight flutters. The mirror does not reflect the room.",
      "It reflects a different night — the same street, the same rain.",
      "And in the glass, someone with your face mouths the words: ‘Don't come.’",
    ],
    choices: [
      { label: "Touch the glass", to: "twist" },
      { label: "Smash the mirror", to: "bad_mirror" },
      { label: "Whisper your name", to: "dawn_good" },
    ],
  },

  bad_mirror: {
    id: "bad_mirror",
    image: sceneMirror,
    mood: "intense",
    chapter: "Finale",
    narration: [
      "Glass rains across the floorboards.",
      "The candles snuff out one by one — and somewhere, in another room of another life,",
      "a stranger with your face suddenly opens his eyes and smiles.",
    ],
    ending: {
      kind: "bad",
      title: "Something walked out wearing you",
      epitaph: "You broke the only window between you and him.",
    },
  },

  twist: {
    id: "twist",
    image: sceneMirror,
    mood: "dread",
    chapter: "Finale",
    narration: [
      "The glass is warm. It gives, like water.",
      "You step through — and step out — into the same rain-soaked street.",
      "An envelope waits in your coat pocket. No name. No return address.",
    ],
    ending: {
      kind: "twist",
      title: "You have been here before",
      epitaph: "The letter was always from you. The door was always yours to choose again.",
    },
  },

  dawn_good: {
    id: "dawn_good",
    image: sceneDawn,
    mood: "hope",
    chapter: "Finale",
    narration: [
      "The voice on the line was your own — older, tired, kind.",
      "It told you what you needed to hear, and where the danger sleeps.",
      "By morning the city is gold, and the letter in your pocket is gone.",
    ],
    ending: {
      kind: "good",
      title: "You chose courage",
      epitaph: "Some doors open only for those willing to listen first.",
    },
  },
};

export const TITLE_SCENE = {
  image: sceneTitle,
};

export function moodTone(mood: Mood) {
  switch (mood) {
    case "calm": return "from-sky-950/60 via-background/40 to-background";
    case "suspense": return "from-amber-950/40 via-background/60 to-background";
    case "intense": return "from-red-950/50 via-background/60 to-background";
    case "dread": return "from-purple-950/40 via-background/70 to-background";
    case "hope": return "from-amber-200/20 via-background/50 to-background";
  }
}
