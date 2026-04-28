import { createFileRoute } from "@tanstack/react-router";
import TimeExperience from "@/components/TimeExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Time Changes Everything" },
      {
        name: "description",
        content: "An evolving web experience. Stay. Watch. Witness how time transforms everything.",
      },
      { property: "og:title", content: "Time Changes Everything" },
      {
        property: "og:description",
        content: "An evolving web experience. Stay. Watch. Witness how time transforms everything.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <TimeExperience />;
}
