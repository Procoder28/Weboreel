import { createFileRoute } from "@tanstack/react-router";
import { MultiverseExperience } from "@/components/multiverse/MultiverseExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Multiverse Scroll — Travel Between Realities" },
      { name: "description", content: "A cinematic scroll-driven journey through 5 alternate universes. Cyberpunk cities, medieval webs, abyssal depths, cosmic voids and reclaimed forests." },
      { property: "og:title", content: "The Multiverse Scroll" },
      { property: "og:description", content: "Every scroll changes reality. Travel through 5 alternate universes." },
    ],
  }),
  component: Index,
});

function Index() {
  return <MultiverseExperience />;
}
