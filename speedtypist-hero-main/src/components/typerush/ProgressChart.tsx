import { Attempt } from "@/lib/storage";

type Props = { attempts: Attempt[] };

export function ProgressChart({ attempts }: Props) {
  // Oldest -> newest, last 10
  const data = [...attempts].slice(0, 10).reverse();

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        No data yet — finish a test to see your trend.
      </div>
    );
  }

  const W = 600;
  const H = 200;
  const PAD = 28;
  const max = Math.max(...data.map((d) => d.wpm), 40);
  const min = 0;

  const points = data.map((d, i) => {
    const x = PAD + (i * (W - PAD * 2)) / Math.max(1, data.length - 1);
    const y = H - PAD - ((d.wpm - min) / (max - min)) * (H - PAD * 2);
    return { x, y, wpm: d.wpm };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const area = `${path} L ${points[points.length - 1].x} ${H - PAD} L ${points[0].x} ${H - PAD} Z`;

  return (
    <div className="rounded-xl border border-border bg-card/70 p-4 shadow-card">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + t * (H - PAD * 2)}
            y2={PAD + t * (H - PAD * 2)}
            stroke="hsl(var(--border))"
            strokeDasharray="3 4"
          />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" />
            <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
              {p.wpm}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
