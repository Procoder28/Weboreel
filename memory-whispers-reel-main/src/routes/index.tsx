import { createFileRoute } from "@tanstack/react-router";
import { CosmicExperience } from "@/components/CosmicExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Step Into My World — A Cosmic 3D Memory Journey" },
      {
        name: "description",
        content:
          "An interactive Three.js experience: explore a cosmic memory void and uncover a personal story of becoming.",
      },
      { property: "og:title", content: "Step Into My World" },
      {
        property: "og:description",
        content: "A 3D interactive story you walk through, not a website you read.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <CosmicExperience />;
}
