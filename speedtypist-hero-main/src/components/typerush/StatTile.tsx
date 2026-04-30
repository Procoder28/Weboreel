import { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
};

export function StatTile({ label, value, hint, accent }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card/70 px-5 py-4 shadow-card">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-mono text-3xl sm:text-4xl font-bold tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
