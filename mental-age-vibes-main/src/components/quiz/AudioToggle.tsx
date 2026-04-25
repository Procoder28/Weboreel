import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setMuted } from "@/lib/audio";

const STORAGE_KEY = "mental-age-muted";

export function AudioToggle() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const m = stored === "1";
    setMutedState(m);
    setMuted(m);
  }, []);

  const toggle = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      className="press fixed top-4 right-4 z-50 grid h-11 w-11 place-items-center rounded-full glass-card text-foreground/80 hover:text-foreground transition-colors"
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}