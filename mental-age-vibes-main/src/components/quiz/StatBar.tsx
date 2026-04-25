import { useEffect, useState } from "react";

interface Props {
  label: string;
  value: number;
  delay?: number;
}

export function StatBar({ label, value, delay = 0 }: Props) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW(value), 250 + delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-white/90">{label}</span>
        <span className="text-sm font-bold text-white tabular-nums">{Math.round(w)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-white/90 transition-[width] duration-1000 ease-out"
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}