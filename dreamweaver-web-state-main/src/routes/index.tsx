import { createFileRoute } from "@tanstack/react-router";
import { DreamExperience } from "@/components/dream/DreamExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "When The Website Dreams" },
      {
        name: "description",
        content:
          "A surreal interactive experience. The website changes when nobody is watching. Stop moving — and listen.",
      },
      { property: "og:title", content: "When The Website Dreams" },
      {
        property: "og:description",
        content: "Stay awhile. The website dreams when you stop moving.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <DreamExperience />;
}
