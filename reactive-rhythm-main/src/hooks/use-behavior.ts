import { useEffect, useState } from "react";
import { behavior, type BehaviorState } from "@/lib/behavior";

export function useBehavior(): BehaviorState {
  const [s, setS] = useState<BehaviorState>(() => ({ ...behavior.state }));
  useEffect(() => {
    const unsub = behavior.subscribe((st) => setS({ ...st }));
    return () => {
      unsub();
    };
  }, []);
  return s;
}
