import { createFileRoute } from "@tanstack/react-router";
import { WorldExperience } from "@/components/WorldExperience";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "This Is Your World — A living moment in time" },
      {
        name: "description",
        content:
          "An immersive, time-aware experience that adapts to your morning, evening, and night. The world changes with time.",
      },
      { property: "og:title", content: "This Is Your World" },
      {
        property: "og:description",
        content: "A calm, cinematic experience that reflects your current moment.",
      },
    ],
  }),
});

function Index() {
  return <WorldExperience />;
}
