import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { MovieFormData } from "@/lib/movie-types";
import { playWhoosh } from "@/lib/sfx";

const PERSONALITIES = [
  { v: "funny", e: "😂", l: "Funny" },
  { v: "serious", e: "🧐", l: "Serious" },
  { v: "chaotic", e: "🌪️", l: "Chaotic" },
  { v: "romantic", e: "💖", l: "Romantic" },
  { v: "ambitious", e: "🚀", l: "Ambitious" },
];

const LOVE_OPTIONS = [
  { v: "single & thriving", e: "✨" },
  { v: "in love", e: "💕" },
  { v: "it's complicated", e: "🌀" },
  { v: "heartbroken", e: "💔" },
  { v: "skip", e: "🤐" },
];

interface Props {
  onComplete: (data: MovieFormData) => void;
}

export function MovieForm({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<MovieFormData>({
    name: "",
    personality: "",
    goal: "",
    struggle: "",
    loveLife: "",
    dramaLevel: 7,
  });

  const next = () => {
    playWhoosh();
    if (step === 5) {
      onComplete(data);
    } else {
      setStep((s) => s + 1);
    }
  };
  const back = () => {
    playWhoosh();
    setStep((s) => Math.max(0, s - 1));
  };

  const canAdvance = (() => {
    switch (step) {
      case 0: return data.name.trim().length > 0;
      case 1: return data.personality.length > 0;
      case 2: return data.goal.trim().length > 0;
      case 3: return data.struggle.trim().length > 0;
      case 4: return data.loveLife.length > 0;
      default: return true;
    }
  })();

  return (
    <div className="relative w-full max-w-2xl mx-auto px-6 py-12">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === step ? "40px" : "16px",
              background: i <= step ? "var(--gold)" : "oklch(0.85 0.17 85 / 0.2)",
              boxShadow: i === step ? "0 0 12px var(--gold)" : "none",
            }}
          />
        ))}
      </div>

      <div key={step} className="animate-fade-up min-h-[280px]">
        {step === 0 && (
          <div className="text-center space-y-6">
            <p className="text-gold/70 font-display tracking-widest uppercase text-sm">Scene 1</p>
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              What's the hero's <span className="gradient-gold-text">name?</span>
            </h2>
            <Input
              autoFocus
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && canAdvance && next()}
              placeholder="Your name..."
              className="max-w-md mx-auto h-14 text-center text-xl font-display bg-card/40 border-gold/30 focus-visible:ring-gold focus-visible:border-gold"
            />
          </div>
        )}

        {step === 1 && (
          <div className="text-center space-y-8">
            <p className="text-gold/70 font-display tracking-widest uppercase text-sm">Scene 2</p>
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              Pick your <span className="gradient-gold-text">vibe</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.v}
                  onClick={() => setData({ ...data, personality: p.v })}
                  className={`glass-card px-5 py-4 rounded-2xl transition-all hover:scale-105 ${
                    data.personality === p.v
                      ? "ring-2 ring-gold shadow-[0_0_30px_oklch(0.85_0.17_85/0.5)]"
                      : ""
                  }`}
                >
                  <div className="text-3xl mb-1">{p.e}</div>
                  <div className="text-sm font-display text-foreground">{p.l}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-6">
            <p className="text-gold/70 font-display tracking-widest uppercase text-sm">Scene 3</p>
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              The hero's <span className="gradient-gold-text">dream?</span>
            </h2>
            <Input
              autoFocus
              value={data.goal}
              onChange={(e) => setData({ ...data, goal: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && canAdvance && next()}
              placeholder="To become a famous singer..."
              className="max-w-xl mx-auto h-14 text-center text-lg bg-card/40 border-gold/30 focus-visible:ring-gold focus-visible:border-gold"
            />
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <p className="text-gold/70 font-display tracking-widest uppercase text-sm">Scene 4</p>
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              The biggest <span className="gradient-gold-text">struggle?</span>
            </h2>
            <Input
              autoFocus
              value={data.struggle}
              onChange={(e) => setData({ ...data, struggle: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && canAdvance && next()}
              placeholder="Family doesn't believe in me..."
              className="max-w-xl mx-auto h-14 text-center text-lg bg-card/40 border-gold/30 focus-visible:ring-gold focus-visible:border-gold"
            />
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-8">
            <p className="text-gold/70 font-display tracking-widest uppercase text-sm">Scene 5</p>
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              And the <span className="gradient-gold-text">love story?</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-xl mx-auto">
              {LOVE_OPTIONS.map((o) => (
                <button
                  key={o.v}
                  onClick={() => setData({ ...data, loveLife: o.v })}
                  className={`glass-card px-4 py-3 rounded-xl transition-all hover:scale-105 ${
                    data.loveLife === o.v
                      ? "ring-2 ring-gold shadow-[0_0_30px_oklch(0.85_0.17_85/0.5)]"
                      : ""
                  }`}
                >
                  <span className="text-2xl mr-2">{o.e}</span>
                  <span className="font-display text-foreground capitalize">{o.v}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center space-y-8">
            <p className="text-gold/70 font-display tracking-widest uppercase text-sm">Final Scene</p>
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              How much <span className="gradient-gold-text">drama?</span>
            </h2>
            <div className="max-w-xl mx-auto px-4 space-y-6">
              <div className="text-7xl font-display gradient-gold-text glow-gold">
                {data.dramaLevel}
              </div>
              <Slider
                value={[data.dramaLevel]}
                onValueChange={(v) => setData({ ...data, dramaLevel: v[0] })}
                min={1}
                max={10}
                step={1}
                className="[&_[role=slider]]:bg-gold [&_[role=slider]]:border-gold [&_[role=slider]]:shadow-[0_0_20px_var(--gold)]"
              />
              <div className="flex justify-between text-sm text-muted-foreground font-display">
                <span>Slice of life</span>
                <span>Bhansali level</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-12 px-2">
        <Button
          variant="ghost"
          onClick={back}
          disabled={step === 0}
          className="text-gold/70 hover:text-gold hover:bg-gold/10 disabled:opacity-0"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={next}
          disabled={!canAdvance}
          className="bg-gold text-primary-foreground hover:bg-gold/90 font-display tracking-wider uppercase px-8 h-12 rounded-full animate-pulse-glow disabled:opacity-50 disabled:animate-none"
        >
          {step === 5 ? (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Roll the cameras
            </>
          ) : (
            <>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
