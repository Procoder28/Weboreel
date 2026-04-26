import { useEffect, useState } from "react";

interface Props {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  leftHint: string;
  rightHint: string;
  variant?: "neon" | "electric" | "amber";
}

export function F1Slider({ label, min, max, value, onChange, leftHint, rightHint, variant = "neon" }: Props) {
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);
  const pct = ((val - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="font-display text-xs tracking-[0.25em] uppercase text-foreground">{label}</span>
        <span className="font-mono text-lg font-bold tabular-nums text-electric">{val}</span>
      </div>
      <input
        type="range"
        min={min} max={max} value={val}
        className={`f1-slider ${variant === "electric" ? "electric" : variant === "amber" ? "amber" : ""}`}
        style={{ ["--val" as any]: `${pct}%` }}
        onChange={(e) => { const n = Number(e.target.value); setVal(n); onChange(n); }}
      />
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{leftHint}</span>
        <span>{rightHint}</span>
      </div>
    </div>
  );
}
