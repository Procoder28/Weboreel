export type Phase = "morning" | "evening" | "night";

export interface ThemeTokens {
  bgFrom: string;
  bgVia: string;
  bgTo: string;
  foreground: string;
  accentGlow: string;
  particle: string;
  rays: number;     // opacity of light rays
  stars: boolean;
  greeting: string;
  tagline: string;
}

export const THEMES: Record<Phase, ThemeTokens> = {
  morning: {
    bgFrom: "oklch(0.92 0.05 230)",
    bgVia: "oklch(0.94 0.07 90)",
    bgTo: "oklch(0.98 0.02 90)",
    foreground: "oklch(0.28 0.06 250)",
    accentGlow: "oklch(0.92 0.14 90)",
    particle: "oklch(1 0 0 / 0.85)",
    rays: 0.55,
    stars: false,
    greeting: "Good morning",
    tagline: "The world wakes with you",
  },
  evening: {
    bgFrom: "oklch(0.78 0.16 50)",
    bgVia: "oklch(0.65 0.18 30)",
    bgTo: "oklch(0.42 0.12 20)",
    foreground: "oklch(0.97 0.03 80)",
    accentGlow: "oklch(0.85 0.18 60)",
    particle: "oklch(0.95 0.1 70 / 0.7)",
    rays: 0.35,
    stars: false,
    greeting: "Good evening",
    tagline: "Time shapes everything around you",
  },
  night: {
    bgFrom: "oklch(0.18 0.06 270)",
    bgVia: "oklch(0.12 0.05 280)",
    bgTo: "oklch(0.06 0.02 260)",
    foreground: "oklch(0.95 0.02 250)",
    accentGlow: "oklch(0.55 0.14 280)",
    particle: "oklch(1 0 0 / 0.9)",
    rays: 0,
    stars: true,
    greeting: "Good night",
    tagline: "The world changes with time",
  },
};

export function getPhase(date: Date): Phase {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 19) return "evening";
  return "night";
}
