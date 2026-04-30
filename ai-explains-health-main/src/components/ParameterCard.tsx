import { StatusBadge } from "./StatusBadge";
import type { ReportParameter } from "@/lib/report-types";
import { Lightbulb, Sparkles } from "lucide-react";

export function ParameterCard({ p }: { p: ReportParameter }) {
  return (
    <div className="glass-card p-5 sm:p-6 transition-all hover:translate-y-[-2px] hover:shadow-[var(--shadow-glow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">{p.name}</h3>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-2xl font-semibold text-primary-glow">
              {p.value}
              {p.unit ? <span className="ml-1 text-sm text-muted-foreground">{p.unit}</span> : null}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Normal: <span className="font-mono">{p.normalRange}</span>
            {p.rangeSource === "general" ? <span className="ml-1 opacity-70">(general adult ref.)</span> : null}
          </p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground/90">{p.explanation}</p>

      {p.reasons?.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Possible general reasons
          </div>
          <ul className="space-y-1 text-sm text-foreground/80">
            {p.reasons.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="text-accent">•</span>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {p.tips?.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-primary" /> Lifestyle tips
          </div>
          <ul className="space-y-1 text-sm text-foreground/80">
            {p.tips.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="text-primary">•</span>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
