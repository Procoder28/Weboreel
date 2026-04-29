import { createFileRoute } from "@tanstack/react-router";
import ReverseStory from "@/components/ReverseStory";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "The Reverse Story — scroll up to remember" },
      {
        name: "description",
        content:
          "An interactive storytelling experience. Scroll upward to reveal the past, and watch the same words change meaning.",
      },
      { property: "og:title", content: "The Reverse Story" },
      {
        property: "og:description",
        content:
          "Scroll upward to uncover the past. The same words, a different meaning.",
      },
    ],
  }),
});

function Index() {
  return <ReverseStory />;
}
