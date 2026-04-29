import { createFileRoute } from "@tanstack/react-router";
import SensorWorld from "@/components/SensorWorld";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Sensor World — Tilt & Shake Reality" },
      { name: "description", content: "An immersive web experience that reacts in real time to your phone's tilt, motion, and environment. Tilt to control gravity, shake to break the world." },
      { property: "og:title", content: "Sensor World — Tilt & Shake Reality" },
      { property: "og:description", content: "Real-time sensor-driven interactive scene. Tilt your phone, shake to reset." },
    ],
  }),
});

function Index() {
  return <SensorWorld />;
}
