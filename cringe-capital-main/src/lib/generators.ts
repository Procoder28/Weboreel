// Pure data + generator functions for the Corporate Buzzword Generator.

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

export type Mode = "silicon" | "linkedin" | "ai" | "crypto" | "guru";

export const MODES: { id: Mode; label: string; emoji: string; blurb: string }[] = [
  { id: "silicon", label: "Silicon Valley", emoji: "🚀", blurb: "Maximum startup nonsense" },
  { id: "linkedin", label: "LinkedIn Influencer", emoji: "💼", blurb: "Cringe motivation overload" },
  { id: "ai", label: "AI Hype", emoji: "🤖", blurb: "Everything is AI-powered" },
  { id: "crypto", label: "Crypto Bro", emoji: "📈", blurb: "Blockchain everywhere" },
  { id: "guru", label: "Productivity Guru", emoji: "🧠", blurb: "Wake up at 4AM energy" },
];

const PREFIXES = ["Neuro", "Quantum", "Hyper", "Meta", "Synergy", "Cogni", "Lumi", "Nimbus", "Zen", "Apex", "Flux", "Vibe", "Core", "Nova", "Echo", "Pulse"];
const ROOTS = ["Chain", "Mind", "Loop", "Stack", "Grid", "Wave", "Forge", "Cloud", "Sphere", "Lab", "Hive", "Pilot", "Kit", "Orbit", "Flow"];
const SUFFIXES = ["AI", "Labs", "io", "ly", "X", ".ai", "HQ", "OS"];

const ADJ = ["scalable", "decentralized", "AI-powered", "blockchain-native", "cloud-first", "agentic", "frictionless", "human-centric", "vertically-integrated", "post-mobile", "serverless", "real-time", "next-gen", "hyper-personalized"];
const VERBS = ["leveraging", "disrupting", "reimagining", "democratizing", "operationalizing", "unbundling", "rebundling", "orchestrating", "synergizing"];
const NOUNS = ["mindfulness optimization", "emotional synergy", "supply-chain karma", "B2B vibes", "cross-functional energy", "productivity alpha", "human capital", "decentralized trust", "developer joy", "ambient commerce", "AI-native workflows"];
const FOR_WHO = ["remote workers", "Gen Z founders", "side-hustle dads", "post-burnout PMs", "AI agents", "solopreneurs", "Series A teams", "thought leaders"];

const BUZZWORDS = ["synergy", "disruption", "blockchain", "AI-powered", "scalable", "ecosystem", "agentic", "frictionless", "moat", "north star", "10x", "pivot", "hockey stick", "vertical SaaS", "ZIRP", "moonshot", "founder mode"];

export const FLOATING_WORDS = BUZZWORDS;

const TAGLINE_PATTERNS = [
  (n: string) => `Uber for ${pick(["Thoughts", "Sleep", "Sandwiches", "Regret", "Friendship", "Tabs"])}.`,
  () => `It's like Slack, but ${pick(["sentient", "spiritual", "on-chain", "for dogs"])}.`,
  () => `The ${pick(["AI", "blockchain", "agent", "vibe"])} layer for ${pick(FOR_WHO)}.`,
  () => `Notion meets ${pick(["therapy", "ayahuasca", "OpenAI", "your ex"])}.`,
];

const FUNDING_ROUNDS = ["Pre-Seed", "Seed", "Seed Extension", "Series A", "Series B", "Series Definitely-Real"];
const INVESTORS = ["a16z", "Sequoia", "Y Combinator", "Tiger Global", "Founders Fund", "your dad", "an anonymous DAO", "SoftBank's couch cushions"];

export interface Startup {
  name: string;
  mission: string;
  funding: string;
  valuation: string;
  tagline: string;
  investors: string;
  status: "Stealth" | "Pre-Launch" | "Scaling" | "Acquired" | "Pivoting" | "Exploded";
}

export function generateStartup(mode: Mode = "silicon"): Startup {
  const name = `${pick(PREFIXES)}${pick(ROOTS)}${Math.random() > 0.5 ? pick(SUFFIXES) : ""}`;
  const mission = generateMission(mode);
  const amount = (Math.floor(Math.random() * 480) + 12);
  const valuation = (Math.random() * 8 + 0.4).toFixed(1);
  const tagline = pick(TAGLINE_PATTERNS)(name);
  const status = pick(["Stealth", "Pre-Launch", "Scaling", "Acquired", "Pivoting", "Exploded"] as const);
  return {
    name,
    mission,
    funding: `Raised $${amount}M ${pick(FUNDING_ROUNDS)}`,
    valuation: `$${valuation}B valuation`,
    tagline,
    investors: `Led by ${pick(INVESTORS)}, with participation from ${pick(INVESTORS)}`,
    status,
  };
}

export function generateMission(mode: Mode = "silicon"): string {
  const a = pickN(ADJ, 2);
  const verb = pick(VERBS);
  const noun = pick(NOUNS);
  const audience = pick(FOR_WHO);
  let sentence = `${cap(verb)} ${a[0]}, ${a[1]} ${noun} for ${audience}.`;
  if (mode === "ai") sentence = sentence.replace(noun, `AI-native ${noun}`);
  if (mode === "crypto") sentence = sentence + ` On-chain. Verifiable. Immutable.`;
  if (mode === "guru") sentence = `Before 5AM, we're ` + sentence.toLowerCase();
  return sentence;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// LinkedIn post generator
const HOOKS = [
  "Today my 6-year-old taught me a powerful lesson about B2B scalability.",
  "I just got rejected by 47 investors. Here's why that's a blessing. 🧵",
  "I fired my entire team this morning. By 11am we hit a new revenue record.",
  "An Uber driver said one sentence that changed my entire business model.",
  "I deleted LinkedIn for 24 hours. The results will shock you.",
  "My therapist told me to slow down. So I raised another round instead.",
];
const LESSONS = [
  "Comfort is the enemy of compounding.",
  "Your network is your net worth, but only at 4AM.",
  "If you're not embarrassed by your MVP, you're not Jeff Bezos.",
  "Hire slow. Fire faster. Sleep never.",
  "Vision without revenue is just journaling.",
];
const HASHTAGS = ["#Leadership", "#GrowthMindset", "#Hustle", "#Founders", "#AI", "#Web3", "#FutureOfWork", "#Synergy", "#Agile", "#NoExcuses", "#Grind", "#ThoughtLeader", "#Disruption", "#Scaling", "#FoundersJourney", "#5AMClub", "#BuildInPublic", "#VibeCEO", "#NeverSettle", "#CrushIt"];

export interface LinkedInPost {
  author: string;
  title: string;
  hook: string;
  body: string;
  lesson: string;
  hashtags: string;
  likes: number;
  comments: number;
  reposts: number;
}

const FIRST = ["Brad", "Chad", "Ashley", "Tyler", "Brooke", "Zane", "Skyler", "Dax", "Hunter", "Cameron"];
const LAST = ["Sterling", "Maverick", "Goldstein", "Vance", "Holloway", "Pierce", "Ashford", "Thornton"];
const TITLES = ["Serial Founder | 4× Exit", "Visionary CEO | TEDx Speaker", "Startup Whisperer | Angel", "Chief Vibes Officer", "AI Evangelist | ex-Google", "Productivity Coach | Author"];

export function generateLinkedInPost(): LinkedInPost {
  const hook = pick(HOOKS);
  const lesson = pick(LESSONS);
  const tags = pickN(HASHTAGS, 12).join(" ");
  const body = `So I'm standing in line at ${pick(["Erewhon", "the airport lounge", "Equinox", "a SoulCycle", "Whole Foods"])} when it hits me.\n\nWe're all chasing ${pick(["KPIs", "metrics", "the wrong dopamine", "vanity revenue"])}, but nobody's chasing ${pick(["meaning", "alignment", "true north", "soul-market fit"])}.\n\n${pick(["I cried.", "I wrote it on a napkin.", "I emailed my board immediately.", "My driver clapped."])}\n\nThat's when I realized:`;
  return {
    author: `${pick(FIRST)} ${pick(LAST)}`,
    title: pick(TITLES),
    hook,
    body,
    lesson,
    hashtags: tags,
    likes: Math.floor(Math.random() * 14000) + 800,
    comments: Math.floor(Math.random() * 1200) + 40,
    reposts: Math.floor(Math.random() * 600) + 12,
  };
}

// Investor pitch
export interface Pitch {
  product: string;
  problem: string;
  solution: string;
  market: string;
  revenue: string;
  ask: string;
}

const PRODUCTS = [
  "AI-powered toothbrushes for remote workers",
  "Blockchain-based hugs",
  "Uber for sleep",
  "Subscription oxygen for founders",
  "An AI that pivots your startup for you",
  "NFT receipts for emotional damage",
  "GPT-powered houseplants",
  "A dating app, but only for your future self",
];

export function generatePitch(): Pitch {
  const product = pick(PRODUCTS);
  const tam = (Math.floor(Math.random() * 1900) + 100);
  const arr = (Math.floor(Math.random() * 800) + 20);
  const ask = (Math.floor(Math.random() * 90) + 5);
  return {
    product,
    problem: `${Math.floor(Math.random() * 90 + 8)}% of ${pick(FOR_WHO)} suffer from ${pick(["chronic synergy deficits", "untracked vibes", "sub-optimal alignment", "Slack-induced ennui"])}.`,
    solution: generateMission(),
    market: `$${tam}B TAM, growing at ${Math.floor(Math.random() * 80 + 20)}% YoY (we made this up).`,
    revenue: `Projected $${arr}M ARR by Q3 ${new Date().getFullYear() + 1}. Path to profitability: vibes.`,
    ask: `Raising $${ask}M at a $${(ask * (Math.random() * 12 + 6)).toFixed(0)}M post-money. No revenue, but lots of momentum.`,
  };
}

// Job titles
const TITLE_PRE = ["Senior", "Chief", "Lead", "Principal", "Global", "Head of"];
const TITLE_MID = ["Synergy", "Vibes", "Innovation", "Growth", "AI", "Agile", "Quantum", "Web3", "People", "Cloud", "Strategic", "Disruption"];
const TITLE_END = ["Architect", "Ninja", "Evangelist", "Officer", "Wizard", "Sherpa", "Catalyst", "Storyteller", "Alchemist", "Rockstar"];

export function generateJobTitle(): string {
  return `${pick(TITLE_PRE)} ${pick(TITLE_MID)} ${pick(TITLE_END)}`;
}

// Investor rejection
const REJECTIONS = [
  "We love the vision but not the existence.",
  "Great team, terrible everything else.",
  "It's a no from us — and from God.",
  "The TAM is large, but our patience is not.",
  "We'd invest, but we already passed on a better version of this in 2019.",
  "Come back when you have less ambition and more revenue.",
];
export const generateRejection = () => pick(REJECTIONS);

// Bingo
export const BINGO_TILES = [
  "Pivoted to AI", "Raised Seed Round", "Posted cringe thread", "Fired co-founder",
  "Said 'we're hiring'", "Quoted Naval", "Did a podcast", "Cried on stage",
  "Used 'moat' wrong", "Compared self to Jobs", "Mentioned mom",
  "Did 75 Hard", "Slept 4 hours", "Took ayahuasca", "Got rugged",
  "DM'd Elon", "Tweeted 'building'", "Renamed startup", "Pretended to read",
  "Bought a Tesla", "Quit Twitter (back in 1hr)", "Hired 'Chief of Staff'",
  "Subtweeted YC", "Pivoted again", "Free",
];

// Funding ticker
export function generateTickerItem(): string {
  const name = `${pick(PREFIXES)}${pick(ROOTS)}${Math.random() > 0.6 ? pick(SUFFIXES) : ""}`;
  const amount = Math.floor(Math.random() * 480) + 8;
  const verbs = ["raised", "secured", "closed", "announced"];
  return `${name} ${pick(verbs)} $${amount}M ${pick(FUNDING_ROUNDS)}`;
}

// Funding simulator outcomes
export const SIMULATOR_OUTCOMES: { label: string; emoji: string; tone: "good" | "bad" | "neutral" }[] = [
  { label: "ACQUIRED for $1.2B (mostly stock)", emoji: "🎉", tone: "good" },
  { label: "IPO'd. Stock down 84% in 6 months.", emoji: "📉", tone: "bad" },
  { label: "Pivoted to AI. Again.", emoji: "🔁", tone: "neutral" },
  { label: "Ran out of runway. Founder now does podcasts.", emoji: "💀", tone: "bad" },
  { label: "Raised $400M Series C at $9B valuation.", emoji: "🚀", tone: "good" },
  { label: "Sued by ex co-founder. Settled in vibes.", emoji: "⚖️", tone: "bad" },
  { label: "Acqui-hired by Google. Product killed Tuesday.", emoji: "🪦", tone: "neutral" },
];
