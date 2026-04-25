import { useEffect, useState } from "react";
import { STORY, moodTone, type Scene } from "@/lib/story";
import { audio } from "@/lib/audio";

type Props = {
  sceneId: string;
  history: string[];
  onChoose: (toId: string, label: string) => void;
  onEnd: (scene: Scene) => void;
};

export function SceneStage({ sceneId, history, onChoose, onEnd }: Props) {
  const scene = STORY[sceneId];
  const [revealedLines, setRevealedLines] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [thinking, setThinking] = useState<string | null>(null);

  useEffect(() => {
    audio.playMood(scene.mood);
    audio.sfx("transition");
    if (scene.mood === "dread" || scene.mood === "intense") {
      const t = setTimeout(() => audio.sfx("heartbeat"), 1200);
      return () => clearTimeout(t);
    }
  }, [scene.id, scene.mood]);

  // Reveal narration line by line
  useEffect(() => {
    setRevealedLines(0);
    setShowChoices(false);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setRevealedLines(i);
      if (i >= scene.narration.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShowChoices(true);
          if (scene.ending) onEnd(scene);
        }, 900);
      }
    }, 1600);
    return () => clearInterval(interval);
  }, [scene, onEnd]);

  const handleChoice = (to: string, label: string) => {
    audio.sfx("click");
    setThinking(label);
    setTimeout(() => {
      audio.sfx("creak");
      onChoose(to, label);
      setThinking(null);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* Background image with ken burns */}
      <div key={scene.id} className="absolute inset-0 scene-enter">
        <div
          className="absolute inset-0 bg-cover bg-center ken-burns"
          style={{ backgroundImage: `url(${scene.image})` }}
          aria-hidden
        />
        {/* Mood gradient wash */}
        <div className={`absolute inset-0 bg-gradient-to-b ${moodTone(scene.mood)}`} aria-hidden />
        {/* Bottom dark gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" aria-hidden />
        <div className="absolute inset-0 vignette" aria-hidden />
        <div className="absolute inset-0 grain" aria-hidden />
      </div>

      {/* Chapter label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 scene-enter">
        <p className="font-display italic text-sm md:text-base tracking-[0.3em] uppercase text-primary/80 text-shadow-cinema">
          {scene.chapter}
        </p>
      </div>

      {/* Step counter */}
      <div className="absolute top-6 right-6 z-10 text-xs font-body tracking-widest text-muted-foreground/70">
        SCENE {history.length + 1}
      </div>

      {/* Main narration + choices */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 sm:px-8 md:px-16 pb-10 md:pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-3 md:space-y-4 mb-10">
            {scene.narration.slice(0, revealedLines).map((line, idx) => (
              <p
                key={`${scene.id}-${idx}`}
                className="font-display text-2xl md:text-4xl lg:text-5xl leading-tight text-foreground text-shadow-cinema text-rise"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Choices or ending */}
          {showChoices && !scene.ending && scene.choices && !thinking && (
            <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scene.choices.map((c, i) => (
                <button
                  key={c.label}
                  onClick={() => handleChoice(c.to, c.label)}
                  className="choice-rise group relative text-left p-5 md:p-6 rounded-md border border-primary/30 bg-card/40 backdrop-blur-md hover:border-primary hover:bg-card/70 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-glow active:scale-100 min-h-[88px]"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="absolute top-3 right-4 font-display text-xs tracking-widest text-primary/60">
                    0{i + 1}
                  </div>
                  <p className="font-display text-xl md:text-2xl text-foreground leading-snug pr-8">
                    {c.label}
                  </p>
                  {c.hint && (
                    <p className="mt-2 text-xs md:text-sm text-muted-foreground italic font-body">
                      — {c.hint}
                    </p>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {thinking && (
            <div className="text-center py-8">
              <p className="font-display italic text-xl md:text-2xl text-primary/80 animate-pulse">
                {thinking}…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
