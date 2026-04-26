interface Option<T extends string> { value: T; label: string; sub?: string; }
interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div className="space-y-2">
      <div className="font-display text-xs tracking-[0.25em] uppercase text-foreground">{label}</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`relative px-3 py-2.5 rounded-md border text-xs font-mono uppercase tracking-wider transition-all ${
                active
                  ? "border-[var(--color-neon)] bg-[oklch(0.65_0.27_25_/_0.12)] text-foreground glow-neon"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <div className="font-semibold">{o.label}</div>
              {o.sub && <div className="text-[9px] opacity-70 mt-0.5">{o.sub}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
