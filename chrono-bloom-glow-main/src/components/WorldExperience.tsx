import { useEffect, useRef, useState } from "react";
import { getPhase, THEMES, type Phase } from "@/lib/themes";
import { Particles } from "./Particles";
import { enableAudio, disableAudio, setPhaseAudio } from "@/lib/ambientAudio";

function formatTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  const hh = ((h % 12) || 12).toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return { hm: `${hh}:${m}`, s, ampm };
}

export function WorldExperience() {
  const [now, setNow] = useState(() => new Date());
  const [phase, setPhase] = useState<Phase>(() => getPhase(new Date()));
  const [audioOn, setAudioOn] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNow(d);
      const p = getPhase(d);
      setPhase((prev) => (prev === p ? prev : p));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Apply theme tokens to root via CSS variables (smooth via @property)
  useEffect(() => {
    const t = THEMES[phase];
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--bg-from", t.bgFrom);
    el.style.setProperty("--bg-via", t.bgVia);
    el.style.setProperty("--bg-to", t.bgTo);
    el.style.setProperty("--foreground", t.foreground);
    el.style.setProperty("--accent-glow", t.accentGlow);
    el.style.setProperty("--particle", t.particle);
    if (audioOn) setPhaseAudio(phase);
  }, [phase, audioOn]);

  const t = THEMES[phase];
  const time = formatTime(now);

  const toggleAudio = async () => {
    if (audioOn) {
      disableAudio();
      setAudioOn(false);
    } else {
      await enableAudio(phase);
      setAudioOn(true);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <div className="world-bg" />
      {t.rays > 0 && <div className="rays" style={{ opacity: t.rays }} />}
      <div className="celestial" />
      <Particles phase={phase} color={t.particle} />
      <div className="vignette" />

      <main className="content">
        <p className="eyebrow">{phase}</p>
        <h1 className="headline">
          This is <em>your world</em><br />right now
        </h1>
        <p className="greeting">{t.greeting}</p>
        <div className="clock" aria-live="polite">
          {time.hm}
          <span className="seconds">:{time.s} {time.ampm}</span>
        </div>
        <p className="tagline">{t.tagline}</p>
      </main>

      <button className="audio-toggle" onClick={toggleAudio} aria-pressed={audioOn}>
        {audioOn ? "Sound On" : "Sound Off"}
      </button>
    </div>
  );
}
