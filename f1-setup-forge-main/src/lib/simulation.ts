export type TrackType = "street" | "speed" | "balanced";
export type TireType = "soft" | "medium" | "hard";
export type Weather = "dry" | "wet";

export interface Setup {
  aero: number;        // 0–100 (low = slick, high = wing)
  downforce: number;   // 0–100
  tire: TireType;
  fuel: number;        // 0–100 (% load)
  weather: Weather;
  track: TrackType;
}

export interface LiveStats {
  topSpeed: number;     // 0–100
  cornering: number;    // 0–100
  tireWear: number;     // 0–100 (lower = better)
  stability: number;    // 0–100
}

export interface RaceResult {
  lapTimeMs: number;
  lapTimeStr: string;
  position: number;
  speed: number;
  handling: number;
  tireStrategy: number;
  overall: number;
  feedback: string[];
  isWin: boolean;
  isPoor: boolean;
}

export const DEFAULT_SETUP: Setup = {
  aero: 50,
  downforce: 50,
  tire: "medium",
  fuel: 60,
  weather: "dry",
  track: "balanced",
};

export function computeLive(s: Setup): LiveStats {
  // Aero LOW = slick = top speed, HIGH = wing = grip
  // Downforce LOW = straights, HIGH = corners
  const slickness = (100 - s.aero) * 0.6 + (100 - s.downforce) * 0.4;
  const grip = s.aero * 0.5 + s.downforce * 0.5;

  const tireSpeedBoost = s.tire === "soft" ? 12 : s.tire === "medium" ? 4 : -4;
  const tireWearBase = s.tire === "soft" ? 75 : s.tire === "medium" ? 50 : 25;

  const fuelDrag = (s.fuel - 40) * 0.25; // heavy fuel = slower

  const wetMod = s.weather === "wet" ? -10 : 0;

  const topSpeed = clamp(slickness * 0.85 + tireSpeedBoost - fuelDrag + wetMod + 15);
  const cornering = clamp(grip * 0.9 + (s.tire === "soft" ? 6 : s.tire === "hard" ? -4 : 0) + wetMod + 10);
  const tireWear = clamp(tireWearBase + (s.aero > 60 ? 8 : 0) + (s.weather === "wet" ? -10 : 0));
  // Stability: balance of aero & downforce, penalize extremes
  const balance = 100 - Math.abs(s.aero - s.downforce);
  const stability = clamp(balance * 0.7 + grip * 0.2 + (s.weather === "wet" ? -8 : 5));

  return { topSpeed, cornering, tireWear, stability };
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

// Track preferences
const trackProfile: Record<TrackType, { speedW: number; cornerW: number; baseMs: number; name: string }> = {
  street:   { speedW: 0.25, cornerW: 0.75, baseMs: 88_000, name: "Street Circuit" },
  speed:    { speedW: 0.75, cornerW: 0.25, baseMs: 78_000, name: "High-Speed Track" },
  balanced: { speedW: 0.5,  cornerW: 0.5,  baseMs: 83_000, name: "Balanced Track" },
};

export function trackName(t: TrackType) { return trackProfile[t].name; }

export function simulate(s: Setup): RaceResult {
  const live = computeLive(s);
  const tp = trackProfile[s.track];

  // Score 0–100 of how well setup fits the track
  const fit = (live.topSpeed * tp.speedW + live.cornering * tp.cornerW);
  const wearPenalty = live.tireWear > 70 ? (live.tireWear - 70) * 0.25 : 0;
  const stabilityBonus = (live.stability - 50) * 0.15;

  // Tire vs track strategy score
  let tireFit = 50;
  if (s.track === "street" && s.tire === "soft") tireFit = 85;
  else if (s.track === "street" && s.tire === "medium") tireFit = 65;
  else if (s.track === "speed" && s.tire === "hard") tireFit = 80;
  else if (s.track === "speed" && s.tire === "medium") tireFit = 70;
  else if (s.track === "balanced" && s.tire === "medium") tireFit = 88;
  else if (s.tire === "soft") tireFit = 60;
  else if (s.tire === "hard") tireFit = 55;

  if (s.weather === "wet" && s.tire === "soft") tireFit -= 25;
  if (s.weather === "wet" && s.tire === "hard") tireFit -= 5;

  const wetTimePenalty = s.weather === "wet" ? 3500 : 0;
  const rand = (Math.random() - 0.5) * 800;

  // Lower fit -> more time
  const performance = fit + stabilityBonus - wearPenalty + (tireFit - 50) * 0.2;
  const timeDelta = (75 - performance) * 110 + (s.fuel - 50) * 18 + wetTimePenalty + rand;
  const lapTimeMs = Math.max(tp.baseMs - 2500, tp.baseMs + timeDelta);

  const overall = Math.round(clamp(performance * 0.6 + (100 - live.tireWear) * 0.15 + (tireFit) * 0.25));
  const position = overall >= 88 ? 1 : overall >= 78 ? 2 : overall >= 68 ? 3 : overall >= 58 ? 5 : overall >= 48 ? 8 : overall >= 38 ? 12 : 16;

  const feedback: string[] = [];
  if (s.aero > 70 && s.track === "speed") feedback.push("Too much wing — you're losing serious top speed on the straights.");
  if (s.aero < 30 && s.track === "street") feedback.push("Slick setup on a street circuit — you'll struggle through the corners.");
  if (s.downforce > 70 && s.track === "speed") feedback.push("High downforce is dragging you back on the long straights.");
  if (s.tire === "soft" && s.fuel > 70) feedback.push("Heavy fuel on soft tires — wear will destroy your stint.");
  if (s.tire === "hard" && s.track === "street") feedback.push("Hard tires won't switch on at street-circuit speeds.");
  if (s.weather === "wet" && s.tire === "soft") feedback.push("Soft slicks in the rain — you're aquaplaning into the wall.");
  if (s.weather === "wet" && live.cornering > 70) feedback.push("Solid wet-weather grip setup — confidence through the corners.");
  if (Math.abs(s.aero - s.downforce) < 15) feedback.push("Beautifully balanced chassis — predictable and quick.");
  if (overall >= 85) feedback.push("Championship-winning pace. The garage is on its feet.");
  if (overall < 45) feedback.push("Back to the drawing board — try matching tire compound to track type.");
  if (feedback.length === 0) feedback.push("Solid all-round setup with room to optimize.");

  return {
    lapTimeMs: Math.round(lapTimeMs),
    lapTimeStr: formatLap(lapTimeMs),
    position,
    speed: live.topSpeed,
    handling: live.cornering,
    tireStrategy: Math.round(tireFit),
    overall,
    feedback: feedback.slice(0, 3),
    isWin: position <= 3,
    isPoor: overall < 45,
  };
}

export function formatLap(ms: number): string {
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const mss = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(mss).padStart(3, "0")}`;
}
