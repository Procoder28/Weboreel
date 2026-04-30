import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface GeneratorCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onGenerate: () => void;
  loading?: boolean;
  children?: ReactNode;
  accent?: "neon" | "navy";
}

export function GeneratorCard({ icon, title, subtitle, ctaLabel, onGenerate, loading, children, accent = "neon" }: GeneratorCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border bg-gradient-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-gradient-neon opacity-10 blur-2xl transition-opacity group-hover:opacity-25" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${accent === "neon" ? "bg-gradient-neon text-neon-foreground" : "bg-navy text-navy-foreground"} shadow-glow`}>
              {icon}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <Button size="sm" onClick={onGenerate} disabled={loading} className="bg-gradient-neon font-semibold text-neon-foreground hover:opacity-90">
            {loading ? "Thinking…" : ctaLabel}
          </Button>
        </div>
        {loading && (
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 bg-gradient-neon shimmer" />
          </div>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </Card>
  );
}
