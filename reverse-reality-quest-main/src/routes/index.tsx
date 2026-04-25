import { createFileRoute } from "@tanstack/react-router";
import { ReverseExperience } from "@/components/reverse/ReverseExperience";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <ReverseExperience />;
}
