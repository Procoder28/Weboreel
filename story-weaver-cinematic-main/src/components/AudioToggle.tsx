import { useState } from "react";
import { audio } from "@/lib/audio";

export function AudioToggle() {
  const [muted, setMuted] = useState(audio.isMuted());

  const toggle = () => {
    const next = !muted;
    audio.setMuted(next);
    setMuted(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-11 h-11 rounded-full border border-primary/30 bg-card/60 backdrop-blur-md text-primary hover:border-primary hover:bg-card/90 transition-all hover:scale-110 active:scale-100"
    >
      {muted ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
