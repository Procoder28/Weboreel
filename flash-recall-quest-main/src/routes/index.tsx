import { createFileRoute } from "@tanstack/react-router";
import { MemoryFlashGame } from "@/components/MemoryFlashGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Memory Flash — Watch. Remember. Survive." },
      {
        name: "description",
        content:
          "Memory Flash is a fast-paced neon arcade memory game. Watch the sequence, remember the order, beat your high score.",
      },
      { property: "og:title", content: "Memory Flash — Neon Arcade Memory Game" },
      {
        property: "og:description",
        content: "Watch. Remember. Survive. How many levels can you survive?",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <MemoryFlashGame />;
}
