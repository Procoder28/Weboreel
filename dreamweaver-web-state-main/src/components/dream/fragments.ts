export const FRAGMENTS: Record<"ocean" | "cosmic" | "liminal", string[]> = {
  ocean: [
    "The website dreams of oceans it has never seen.",
    "Somewhere underneath the scroll, jellyfish drift.",
    "It remembers a sound that was never played.",
    "Pages, like tides, return to where they began.",
  ],
  cosmic: [
    "Stars appear indoors when nobody is watching.",
    "It counts visitors the way constellations count light.",
    "Between two clicks there is a quiet galaxy.",
    "Nobody stays long enough to see this.",
  ],
  liminal: [
    "The hallway has no end and no beginning.",
    "A door that was here is no longer here.",
    "The buttons are still breathing.",
    "Are you still there?",
  ],
};

export const WORLDS = ["ocean", "cosmic", "liminal"] as const;
export type World = (typeof WORLDS)[number];

export const WORLD_LABEL: Record<World, string> = {
  ocean: "Ocean Dream",
  cosmic: "Cosmic Dream",
  liminal: "Liminal Dream",
};
