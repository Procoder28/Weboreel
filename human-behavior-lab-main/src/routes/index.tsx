import { createFileRoute } from "@tanstack/react-router";
import { Experience } from "@/components/observer/Experience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "You Are Being Observed" },
      {
        name: "description",
        content:
          "An interactive psychological experience. The website is studying how you behave.",
      },
      { property: "og:title", content: "You Are Being Observed" },
      {
        property: "og:description",
        content: "The scariest thing isn't being watched. It's being understood.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <Experience />;
}
