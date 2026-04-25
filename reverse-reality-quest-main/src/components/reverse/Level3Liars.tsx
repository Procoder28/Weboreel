import { useState } from "react";
import { clickReversed, errorBlip } from "@/lib/audio";
import { pushToast } from "./Toast";

type Props = { onComplete: () => void };

// Level 3 — Lying buttons. Click YES → triggers NO action. The "right answer"
// is to refuse the gift (i.e., choose NO to actually accept). Task: "Accept the gift."
export function Level3Liars({ onComplete }: Props) {
  const [shake, setShake] = useState<"yes" | "no" | null>(null);

  function handle(label: "YES" | "NO") {
    // Inverted: YES does NO, NO does YES
    const realAction = label === "YES" ? "NO" : "YES";
    if (realAction === "YES") {
      clickReversed();
      pushToast("words can lie. you saw through it.");
      setTimeout(onComplete, 500);
    } else {
      errorBlip();
      pushToast("that was a lie. try the opposite word.");
      setShake(label === "YES" ? "yes" : "no");
      setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-10 px-6 scanlines">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">task</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-display">Accept the gift.</h2>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">words can lie</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full max-w-md">
        <button
          onClick={() => handle("YES")}
          className={`flex-1 rounded-2xl border border-primary/50 bg-primary/10 px-8 py-6 font-display text-2xl uppercase tracking-[0.3em] text-primary transition hover:bg-primary/20 hover:shadow-glow ${shake === "yes" ? "animate-shake" : ""}`}
        >
          YES
        </button>
        <button
          onClick={() => handle("NO")}
          className={`flex-1 rounded-2xl border border-destructive/50 bg-destructive/10 px-8 py-6 font-display text-2xl uppercase tracking-[0.3em] text-destructive transition hover:bg-destructive/20 ${shake === "no" ? "animate-shake" : ""}`}
        >
          NO
        </button>
      </div>
    </div>
  );
}
