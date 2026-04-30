import { useEffect, useRef, useState } from "react";

export type DreamPhase = "awake" | "drifting" | "dreaming";

interface Options {
  driftMs?: number;   // when "drifting" begins
  dreamMs?: number;   // when full "dreaming" begins
}

export function useIdleDream({ driftMs = 7000, dreamMs = 12000 }: Options = {}) {
  const [phase, setPhase] = useState<DreamPhase>("awake");
  const [activity, setActivity] = useState(0); // 0 calm — 1 frantic
  const lastActivity = useRef(Date.now());
  const lastMove = useRef(Date.now());
  const moveSpeed = useRef(0);
  const prevPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const bump = (e?: Event) => {
      const now = Date.now();
      if (e && e.type === "mousemove") {
        const me = e as MouseEvent;
        if (prevPos.current) {
          const dx = me.clientX - prevPos.current.x;
          const dy = me.clientY - prevPos.current.y;
          const dt = Math.max(1, now - lastMove.current);
          const v = Math.sqrt(dx * dx + dy * dy) / dt;
          moveSpeed.current = moveSpeed.current * 0.7 + v * 0.3;
        }
        prevPos.current = { x: me.clientX, y: me.clientY };
      }
      lastMove.current = now;
      lastActivity.current = now;
      setPhase((p) => (p === "awake" ? p : "awake"));
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "touchmove", "wheel"];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));

    const tick = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      setActivity(Math.min(1, moveSpeed.current * 8));
      moveSpeed.current *= 0.92;
      if (idle > dreamMs) setPhase("dreaming");
      else if (idle > driftMs) setPhase("drifting");
      else setPhase("awake");
    }, 250);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump));
      clearInterval(tick);
    };
  }, [driftMs, dreamMs]);

  return { phase, activity };
}
