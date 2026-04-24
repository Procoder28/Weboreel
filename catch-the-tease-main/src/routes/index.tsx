import { createFileRoute } from "@tanstack/react-router";
import BeatTheWebsite from "@/components/BeatTheWebsite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Can You Beat the Website? — A Game That Fights Back" },
      {
        name: "description",
        content:
          "A playful interactive game where the website dodges, lies, and glitches to stop you from clicking the button. Six levels of chaos. Can you win?",
      },
      { property: "og:title", content: "Can You Beat the Website?" },
      { property: "og:description", content: "Six levels. One button. The website fights back." },
    ],
  }),
  component: Index,
});

function Index() {
  return <BeatTheWebsite />;
}
