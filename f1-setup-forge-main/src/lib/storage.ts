import { Setup, DEFAULT_SETUP } from "./simulation";

const KEY = "f1-setup-v1";

export function loadSetup(): Setup {
  if (typeof window === "undefined") return DEFAULT_SETUP;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETUP;
    return { ...DEFAULT_SETUP, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETUP; }
}

export function saveSetup(s: Setup) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
