import { useEffect, useState } from "react";
import { isMuted, setMuted, unlockAudio } from "@/lib/audio";

export function MuteButton() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(isMuted()); }, []);
  return (
    <button
      onClick={() => { unlockAudio(); const next = !m; setMuted(next); setM(next); }}
      className="fixed top-4 right-4 z-50 hud-panel px-3 py-2 text-xs font-mono text-muted-foreground hover:text-electric transition-colors"
      aria-label={m ? "Unmute" : "Mute"}
    >
      {m ? "🔇 AUDIO OFF" : "🔊 AUDIO ON"}
    </button>
  );
}
