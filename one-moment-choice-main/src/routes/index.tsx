import { createFileRoute } from "@tanstack/react-router";
import { OneChance } from "@/components/OneChance";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "You Have One Chance" },
      {
        name: "description",
        content: "One click. One decision. One outcome. There's no going back.",
      },
      { property: "og:title", content: "You Have One Chance" },
      {
        property: "og:description",
        content: "One click. One decision. One outcome. There's no going back.",
      },
    ],
  }),
});

function Index() {
  return <OneChance />;
}
