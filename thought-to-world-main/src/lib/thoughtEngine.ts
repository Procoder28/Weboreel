export type World = "cosmic" | "nostalgia" | "melancholy" | "peace" | "hope" | "chaos";

export interface WorldAnalysis {
  world: World;
  scores: Record<World, number>;
  intensity: number; // 0..1
  keywords: string[];
  summary: string;
  dominantFeeling: string;
}

const LEXICON: Record<World, string[]> = {
  nostalgia: ["childhood", "memory", "memories", "old", "home", "friend", "friends", "school", "miss", "remember", "past", "young", "summer", "family", "grandma", "grandpa", "mom", "dad"],
  melancholy: ["sad", "lonely", "alone", "lost", "empty", "tired", "cry", "crying", "broken", "hurt", "pain", "rain", "dark", "miss", "gone", "fade", "silent", "regret", "fear", "afraid"],
  peace: ["calm", "peace", "peaceful", "quiet", "breathe", "still", "nature", "ocean", "forest", "tree", "leaves", "wind", "soft", "rest", "meditate", "garden", "warm", "gentle"],
  hope: ["hope", "future", "dream", "love", "joy", "happy", "light", "bright", "free", "fly", "rise", "shine", "begin", "new", "tomorrow", "smile", "wonder", "believe", "alive"],
  cosmic: ["dream", "dreams", "stars", "star", "galaxy", "universe", "infinite", "space", "cosmic", "void", "moon", "planet", "imagine", "imagination", "beyond", "soul", "mind"],
  chaos: ["chaos", "panic", "stress", "anxious", "anxiety", "overwhelm", "overwhelmed", "loud", "scream", "angry", "rage", "broken", "shatter", "crash", "fast", "blur", "static", "noise"],
};

const FEELING_LABELS: Record<World, string> = {
  nostalgia: "Wistful warmth",
  melancholy: "Quiet sorrow",
  peace: "Soft stillness",
  hope: "Rising light",
  cosmic: "Boundless wonder",
  chaos: "Charged unrest",
};

const SUMMARIES: Record<World, string> = {
  nostalgia: "A golden hour of memories, warm and slowly drifting.",
  melancholy: "A quiet rain on glass — soft, blue, and reflective.",
  peace: "A breath held in green light, gentle and unhurried.",
  hope: "A horizon opening, full of pale gold and possibility.",
  cosmic: "A drift through stars, where thoughts become constellations.",
  chaos: "A storm of signals — bright, loud, alive.",
};

export function analyzeThought(text: string): WorldAnalysis {
  const tokens = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const scores: Record<World, number> = {
    cosmic: 0, nostalgia: 0, melancholy: 0, peace: 0, hope: 0, chaos: 0,
  };
  const matched: string[] = [];

  for (const t of tokens) {
    for (const w of Object.keys(LEXICON) as World[]) {
      if (LEXICON[w].includes(t)) {
        scores[w] += 1;
        matched.push(t);
      }
    }
  }

  // Punctuation-driven intensity
  const exclam = (text.match(/!/g) ?? []).length;
  const caps = (text.match(/\b[A-Z]{3,}\b/g) ?? []).length;
  scores.chaos += exclam * 0.5 + caps * 0.7;

  // Pick world
  let world: World = "cosmic";
  let max = 0;
  (Object.keys(scores) as World[]).forEach((w) => {
    if (scores[w] > max) { max = scores[w]; world = w; }
  });
  if (max === 0) world = "cosmic";

  const intensity = Math.min(1, (tokens.length / 40) + exclam * 0.1 + max * 0.08);
  const keywords = Array.from(new Set(matched)).slice(0, 8);

  return {
    world,
    scores,
    intensity,
    keywords,
    summary: SUMMARIES[world],
    dominantFeeling: FEELING_LABELS[world],
  };
}
