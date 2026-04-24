export function StatBar({
  label,
  value,
  suffix,
  color = "primary",
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: "primary" | "secondary" | "accent";
}) {
  const colorClass =
    color === "primary" ? "from-primary to-secondary"
    : color === "secondary" ? "from-secondary to-accent"
    : "from-accent to-primary";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-display">
          {label}
        </span>
        <span className="text-sm font-mono text-foreground/90">
          {value}{suffix ?? "%"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-[1500ms] ease-out`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}