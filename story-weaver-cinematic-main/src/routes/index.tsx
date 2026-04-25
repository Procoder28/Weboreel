import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { TitleScreen } from "@/components/TitleScreen";
import { SceneStage } from "@/components/SceneStage";
import { EndingScreen } from "@/components/EndingScreen";
import { AudioToggle } from "@/components/AudioToggle";
import type { Scene } from "@/lib/story";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "You Control the Story — A Cinematic Interactive Experience" },
      { name: "description", content: "An interactive noir story where every choice you make rewrites the ending. Three paths. Three endings. One night." },
      { property: "og:title", content: "You Control the Story" },
      { property: "og:description", content: "Every choice changes everything." },
    ],
  }),
  component: Index,
});

type Phase = "title" | "playing" | "ended";

function Index() {
  const [phase, setPhase] = useState<Phase>("title");
  const [sceneId, setSceneId] = useState<string>("start");
  const [history, setHistory] = useState<string[]>([]);
  const [endingScene, setEndingScene] = useState<Scene | null>(null);

  const start = useCallback(() => {
    setSceneId("start");
    setHistory([]);
    setEndingScene(null);
    setPhase("playing");
  }, []);

  const choose = useCallback((to: string) => {
    setHistory((h) => [...h, sceneId]);
    setSceneId(to);
  }, [sceneId]);

  const handleEnd = useCallback((scene: Scene) => {
    setEndingScene(scene);
    setHistory((h) => (h[h.length - 1] === scene.id ? h : [...h, scene.id]));
    setTimeout(() => setPhase("ended"), 4200);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      {phase === "title" && <TitleScreen onStart={start} />}
      {phase === "playing" && (
        <SceneStage
          sceneId={sceneId}
          history={history}
          onChoose={choose}
          onEnd={handleEnd}
        />
      )}
      {phase === "ended" && endingScene && (
        <EndingScreen scene={endingScene} history={history} onRestart={start} />
      )}
      <AudioToggle />
    </main>
  );
}
