import { useEffect, useRef, useState } from "react";
import { StartScreen } from "@/components/reverse/StartScreen";
import { Hud } from "@/components/reverse/Hud";
import { ToastLayer, pushToast } from "@/components/reverse/Toast";
import { Level1Confusion } from "@/components/reverse/Level1Confusion";
import { Level2Inverse } from "@/components/reverse/Level2Inverse";
import { Level3Liars } from "@/components/reverse/Level3Liars";
import { Level4Scroll } from "@/components/reverse/Level4Scroll";
import { Level5Final } from "@/components/reverse/Level5Final";
import { RealityBreak } from "@/components/reverse/RealityBreak";
import { WinScreen } from "@/components/reverse/WinScreen";
import { startAmbient, stopAmbient, setAmbientIntensity } from "@/lib/audio";

type Stage = "start" | "level" | "break" | "win";

const LEVEL_MESSAGES = [
  "stop trusting your instincts",
  "the dot lies about direction",
  "words can lie",
  "scroll betrays you",
  "everything at once",
];

// Contextual teasing messages that appear over time inside a level
const TAUNTS_PER_LEVEL: Record<number, string[]> = {
  1: ["think opposite", "still stuck in normal mode?", "your brain is the bug"],
  2: ["pull to push", "you're getting better…", "trust the wrong way"],
  3: ["nothing means what it says", "lie to win"],
  4: ["down means up", "fight your fingers"],
  5: ["everything betrays you", "good. keep adapting.", "almost reality-broken"],
};

const TOTAL = 5;

export function ReverseExperience() {
  const [stage, setStage] = useState<Stage>("start");
  const [level, setLevel] = useState(1);
  const startRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const tauntTimers = useRef<number[]>([]);

  // Ambient audio lifecycle
  useEffect(() => {
    if (stage === "level") startAmbient();
    if (stage === "win") stopAmbient();
    return () => {
      if (stage !== "level" && stage !== "break") stopAmbient();
    };
  }, [stage]);

  // Ambient intensity scales with level
  useEffect(() => {
    if (stage === "level") setAmbientIntensity((level - 1) / (TOTAL - 1));
  }, [stage, level]);

  // Schedule contextual taunts during a level
  useEffect(() => {
    if (stage !== "level") return;
    const taunts = TAUNTS_PER_LEVEL[level] ?? [];
    tauntTimers.current.forEach((id) => window.clearTimeout(id));
    tauntTimers.current = taunts.map((msg, i) =>
      window.setTimeout(() => pushToast(msg), 4500 + i * 5000)
    );
    return () => {
      tauntTimers.current.forEach((id) => window.clearTimeout(id));
      tauntTimers.current = [];
    };
  }, [stage, level]);

  function start() {
    setLevel(1);
    startRef.current = performance.now();
    setStage("level");
    setTimeout(() => pushToast("not how it works…"), 600);
  }

  function nextLevel() {
    if (level >= TOTAL) {
      setElapsed(performance.now() - startRef.current);
      // Trigger the dramatic wow-moment before the win screen
      setStage("break");
    } else {
      const n = level + 1;
      setLevel(n);
      setTimeout(() => pushToast("you're learning…"), 400);
    }
  }

  function restart() {
    setStage("start");
    setLevel(1);
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground select-none">
      {stage === "start" && <StartScreen onStart={start} />}

      {stage === "level" && (
        <>
          <Hud
            level={level}
            total={TOTAL}
            message={LEVEL_MESSAGES[level - 1] ?? ""}
            onSkip={nextLevel}
          />
          <div className="absolute inset-0">
            {level === 1 && <Level1Confusion onComplete={nextLevel} />}
            {level === 2 && <Level2Inverse onComplete={nextLevel} />}
            {level === 3 && <Level3Liars onComplete={nextLevel} />}
            {level === 4 && <Level4Scroll onComplete={nextLevel} />}
            {level === 5 && <Level5Final onComplete={nextLevel} />}
          </div>
        </>
      )}

      {stage === "break" && <RealityBreak onDone={() => setStage("win")} />}

      {stage === "win" && <WinScreen timeMs={elapsed} onRestart={restart} />}

      <ToastLayer />
    </main>
  );
}
