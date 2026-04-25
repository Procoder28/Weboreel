import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, startAmbient } from "@/lib/audio";

export function MuteButton() {
  const [m, setM] = useState(false);

  useEffect(() => { setM(isMuted()); }, []);

  return (
    <button
      onClick={() => {
        const next = !m;
        setMuted(next);
        setM(next);
        if (!next) startAmbient();
      }}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-csk-navy/80 backdrop-blur border border-border text-csk-yellow flex items-center justify-center hover:bg-csk-navy transition-colors active:scale-90"
      aria-label={m ? "Unmute" : "Mute"}
    >
      {m ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );
}
