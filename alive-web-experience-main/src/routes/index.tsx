import { createFileRoute } from "@tanstack/react-router";
import EvolvingExperience from "@/components/EvolvingExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "It's Changing… — A website that evolves while you use it" },
      {
        name: "description",
        content:
          "An interactive web experience that learns from your behavior and transforms in real-time. Just… interact.",
      },
      { property: "og:title", content: "It's Changing…" },
      {
        property: "og:description",
        content: "A website that evolves while you use it. Sound on.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <EvolvingExperience />;
}
