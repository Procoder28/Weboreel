import { ArrowDown, ArrowUp, Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/report-types";

const config: Record<Status, { label: string; icon: React.ElementType; classes: string }> = {
  low: { label: "Low", icon: ArrowDown, classes: "bg-warning/15 text-warning ring-1 ring-warning/30" },
  high: { label: "High", icon: ArrowUp, classes: "bg-danger/15 text-danger ring-1 ring-danger/30" },
  normal: { label: "Normal", icon: Check, classes: "bg-success/15 text-success ring-1 ring-success/30" },
  unknown: { label: "Unclear", icon: HelpCircle, classes: "bg-muted text-muted-foreground ring-1 ring-border" },
};

export function StatusBadge({ status }: { status: Status }) {
  const c = config[status] ?? config.unknown;
  const Icon = c.icon;
  return (
    <span className={cn("status-pill", c.classes)}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}
