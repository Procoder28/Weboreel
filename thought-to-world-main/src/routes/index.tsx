import { createFileRoute } from "@tanstack/react-router";
import { ThoughtExperience } from "@/components/ThoughtExperience";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <ThoughtExperience />;
}
