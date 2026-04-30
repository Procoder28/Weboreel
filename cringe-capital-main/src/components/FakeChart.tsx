import { useEffect, useState } from "react";

interface FakeChartProps {
  label: string;
  value: string;
  delta: string;
  trend?: "up" | "down";
  seed?: number;
}

export function FakeChart({ label, value, delta, trend = "up", seed = 0 }: FakeChartProps) {
  const [points, setPoints] = useState<number[]>(() => generate(seed));

  useEffect(() => {
    const t = setInterval(() => {
      setPoints((p) => {
        const next = [...p.slice(1), Math.max(4, Math.min(96, p[p.length - 1] + (Math.random() * 18 - (trend === "up" ? 6 : 12))))];
        return next;
      });
    }, 1400);
    return () => clearInterval(t);
  }, [trend]);

  const path = toPath(points);
  const area = `${path} L 100 100 L 0 100 Z`;

  return (
    <div className="rounded-xl border border-border bg-gradient-card p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`text-xs font-semibold ${trend === "up" ? "text-[color:var(--success)]" : "text-destructive"}`}>
          {trend === "up" ? "▲" : "▼"} {delta}
        </span>
      </div>
      <div className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-16 w-full">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--neon)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--neon)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad-${label})`} />
        <path d={path} fill="none" stroke="var(--neon)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function generate(seed: number) {
  const arr: number[] = [];
  let v = 30 + (seed % 30);
  for (let i = 0; i < 24; i++) {
    v = Math.max(8, Math.min(92, v + (Math.random() * 16 - 6)));
    arr.push(v);
  }
  return arr;
}

function toPath(points: number[]) {
  const w = 100 / (points.length - 1);
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * w).toFixed(2)} ${(100 - p).toFixed(2)}`)
    .join(" ");
}
