import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Download, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttendanceInputs, PredictionResult } from "@/lib/attendance";
import { downloadReportPdf } from "@/lib/pdfReport";

interface Props {
  result: PredictionResult;
  inputs: AttendanceInputs;
}

const statusMap = {
  Safe: { Icon: CheckCircle2, label: "Safe", tone: "text-[hsl(var(--success))]" },
  "At Risk": { Icon: AlertTriangle, label: "At Risk", tone: "text-[hsl(var(--warning))]" },
  Shortage: { Icon: XCircle, label: "Shortage", tone: "text-destructive" },
} as const;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-foreground/15 p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl sm:text-4xl tabular-nums">{value}</div>
      {sub && <div className="mt-1 font-mono text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function ResultPanel({ result, inputs }: Props) {
  const s = statusMap[result.status];
  const { Icon } = s;

  // Build a simple weekly suggestion timetable
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const perDayTarget = Math.min(5, result.weekly_target);
  const week = days.map((d, i) => ({
    day: d,
    attend: i < perDayTarget,
  }));

  return (
    <section className="space-y-8">
      <div className="flex items-start justify-between gap-6 border-t border-foreground/15 pt-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Status
          </div>
          <div className={`mt-2 flex items-center gap-3 font-display text-4xl sm:text-5xl ${s.tone}`}>
            <Icon className="h-8 w-8" strokeWidth={1.5} />
            {s.label}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadReportPdf(result, inputs)}
          className="rounded-none border-foreground/20 font-mono text-xs uppercase tracking-widest"
        >
          <Download className="h-3.5 w-3.5 mr-2" /> PDF
        </Button>
      </div>

      <div className="grid gap-px bg-foreground/15 sm:grid-cols-2 lg:grid-cols-4 border border-foreground/15">
        <div className="bg-background">
          <Stat
            label="Current %"
            value={`${result.current_percentage.toFixed(1)}%`}
            sub={`${inputs.attended_classes} of ${inputs.total_classes}`}
          />
        </div>
        <div className="bg-background">
          <Stat
            label="Projected %"
            value={`${result.projected_percentage.toFixed(1)}%`}
            sub={`After ${inputs.planned_leaves} planned leave${inputs.planned_leaves === 1 ? "" : "s"}`}
          />
        </div>
        <div className="bg-background">
          <Stat
            label="Must Attend"
            value={`${result.classes_needed}`}
            sub={`of ${result.remaining_classes} remaining`}
          />
        </div>
        <div className="bg-background">
          <Stat
            label="Can Skip"
            value={`${result.classes_can_skip}`}
            sub={`and stay ≥ ${inputs.required_percentage}%`}
          />
        </div>
      </div>

      <div className="border border-foreground/15 p-6 sm:p-8 bg-secondary/40">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <ArrowRight className="h-3 w-3" /> AI Plan
        </div>
        <p className="mt-4 font-display text-xl sm:text-2xl leading-snug text-balance">
          {result.plan}
        </p>
      </div>

      {result.weekly_target > 0 && (
        <div className="border border-foreground/15">
          <div className="flex items-center gap-2 border-b border-foreground/15 p-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Suggested Week ·{" "}
            {result.weekly_target} class{result.weekly_target === 1 ? "" : "es"} / week ·{" "}
            {result.weeks_remaining} week{result.weeks_remaining === 1 ? "" : "s"} left
          </div>
          <div className="grid grid-cols-5">
            {week.map((d) => (
              <div
                key={d.day}
                className={`p-5 text-center border-r last:border-r-0 border-foreground/15 ${
                  d.attend ? "bg-foreground text-background" : "bg-background"
                }`}
              >
                <div className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                  {d.day}
                </div>
                <div className="mt-2 font-display text-lg">
                  {d.attend ? "Attend" : "Free"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
