import { createFileRoute } from "@tanstack/react-router";
import { DrawAlive } from "@/components/DrawAlive";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Draw → Comes Alive ✨ | Bring your sketches to life" },
      { name: "description", content: "A playful drawing canvas where your sketches come alive with physics, eyes and personality. Works on desktop and mobile." },
      { property: "og:title", content: "Draw → Comes Alive ✨" },
      { property: "og:description", content: "Draw anything and bring it to life with bouncing, walking, wiggling characters." },
    ],
  }),
});

function Index() {
  return <DrawAlive />;
}
