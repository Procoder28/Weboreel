import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTeam } from "@/state/team";
import { analyzeTeam } from "@/server/analyze";
import { playSad } from "@/lib/audio";
import { toast } from "sonner";

export const Route = createFileRoute("/analyzing")({
  head: () => ({
    meta: [{ title: "Analyzing Your XI…" }],
  }),
  component: Analyzing,
});

const STEPS = [
  "Analyzing squad composition…",
  "Evaluating player synergy…",
  "Simulating match scenarios…",
  "Asking the cricket gods…",
];

function Analyzing() {
  const nav = useNavigate();
  const team = useTeam();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (team.selectedCount < 11) { nav({ to: "/builder" }); return; }

    let cancelled = false;
    const interval = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900);

    const run = async () => {
      const captain = team.captainId
        ? team.slots.find((p) => p?.id === team.captainId)
        : team.slots[0];
      const payload = {
        players: team.slots.filter(Boolean).map((p) => ({
          name: p!.name, role: p!.role, rating: p!.rating, tag: p!.tag,
        })),
        captainName: captain?.name ?? team.slots[0]!.name,
      };

      try {
        const res = await analyzeTeam({ data: payload });
        if (cancelled) return;
        if ("error" in res && res.error) {
          toast.error(res.error);
          playSad();
          nav({ to: "/builder" });
          return;
        }
        if ("result" in res && res.result) {
          team.setResult(res.result);
          // small minimum show time
          setTimeout(() => { if (!cancelled) nav({ to: "/result" }); }, 800);
        }
      } catch (e) {
        if (cancelled) return;
        toast.error("Analysis failed. Please try again.");
        playSad();
        nav({ to: "/builder" });
      }
    };
    run();

    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md w-full animate-float-up">
        {/* Spinning ball */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-csk-yellow/20" />
          <div className="absolute inset-0 rounded-full border-4 border-csk-yellow border-t-transparent animate-spin-ball" />
          <div className="absolute inset-3 rounded-full bg-csk-yellow/20 backdrop-blur flex items-center justify-center">
            <span className="text-2xl">🏏</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2 text-shimmer">
          Building your verdict
        </h1>

        <div className="space-y-2 mt-6 text-left">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={[
                "flex items-center gap-3 text-sm transition-all duration-300",
                i <= step ? "opacity-100" : "opacity-30",
              ].join(" ")}
            >
              <div className={[
                "w-2 h-2 rounded-full transition-all",
                i < step ? "bg-csk-yellow" : i === step ? "bg-csk-yellow animate-pulse" : "bg-border",
              ].join(" ")} />
              <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-csk-yellow to-csk-yellow-bright transition-all duration-700"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </main>
  );
}
