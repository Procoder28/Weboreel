import { createFileRoute } from "@tanstack/react-router";
import { SlowExperience } from "@/components/SlowExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Slow Down — a website that notices you" },
      {
        name: "description",
        content:
          "An interactive experience that reacts to how fast you scroll, click, and skip. Adaptive music, hidden rewards, a personality profile at the end.",
      },
      { property: "og:title", content: "Slow Down — a website that notices you" },
      {
        property: "og:description",
        content:
          "Scroll too fast and it pushes back. Wait patiently and it shows you more.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SlowExperience />;
}
