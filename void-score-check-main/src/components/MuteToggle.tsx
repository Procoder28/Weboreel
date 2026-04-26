import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, startMusic } from "@/lib/audio";

export function MuteToggle() {
  const [m, setM] = useState(false);
  useEffect(() => {
    setM(isMuted());
  }, []);
  return (
    <button
      onClick={() => {
        const next = !m;
        setMuted(next);
        setM(next);
        if (!next) startMusic();
      }}
      aria-label={m ? "Unmute" : "Mute"}
      className="fixed top-4 right-4 z-50 grid h-10 w-10 place-items-center rounded-full glass text-foreground/80 transition-transform hover:scale-105 active:scale-95"
    >
      {m ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}
