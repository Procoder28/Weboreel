import { createFileRoute } from "@tanstack/react-router";
import EndlessFall from "@/components/EndlessFall";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Endless Falling — How far can you go?" },
      {
        name: "description",
        content:
          "An immersive endless falling experience. Scroll or swipe to fall through skies, cities, space, and abstract worlds.",
      },
      { property: "og:title", content: "Endless Falling" },
      {
        property: "og:description",
        content: "Fall forever through dynamic worlds. Scroll, swipe, survive.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <EndlessFall />;
}
