interface Props {
  label: string;
  value: number; // 0–100
  color?: "neon" | "electric" | "amber" | "success";
  invert?: boolean; // for tire wear, lower is better
  unit?: string;
}

const colorMap = {
  neon: "var(--color-neon)",
  electric: "var(--color-electric)",
  amber: "var(--color-amber)",
  success: "var(--color-success)",
};

export function StatBar({ label, value, color = "electric", invert, unit = "%" }: Props) {
  const display = invert ? 100 - value : value;
  const c = colorMap[color];
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{label}</span>
        <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: c, textShadow: `0 0 8px ${c}` }}>
          {Math.round(display)}{unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${display}%`,
            background: `linear-gradient(90deg, ${c}, color-mix(in oklab, ${c} 60%, white))`,
            boxShadow: `0 0 12px ${c}`,
          }}
        />
        {/* Tick marks */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-background/40 last:border-r-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
