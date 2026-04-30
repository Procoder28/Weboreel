import { Download, BookOpen, RotateCw, FileCheck, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StudyPlan } from "@/lib/study-plan";
import { exportPlanToPDF } from "@/lib/pdf-export";

interface Props {
  plan: StudyPlan;
  examDate: string;
}

const typeMeta: Record<StudyPlan["schedule"][number]["type"], { label: string; icon: typeof BookOpen; cls: string }> = {
  study: { label: "Study", icon: BookOpen, cls: "bg-primary/10 text-primary border-primary/20" },
  revision: { label: "Revision", icon: RotateCw, cls: "bg-warning/10 text-warning border-warning/20" },
  mock_test: { label: "Mock Test", icon: FileCheck, cls: "bg-success/10 text-success border-success/20" },
  rest: { label: "Rest", icon: Coffee, cls: "bg-muted text-muted-foreground border-border" },
};

export const StudyPlanView = ({ plan, examDate }: Props) => {
  const totalHours = plan.subject_allocation.reduce((sum, s) => sum + s.total_hours, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 md:p-8 shadow-elegant border-border/60 bg-card/80 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Your Study Plan</h2>
            <p className="text-muted-foreground max-w-2xl">{plan.summary}</p>
          </div>
          <Button onClick={() => exportPlanToPDF(plan, examDate)} className="shrink-0">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatPill label="Total days" value={plan.schedule.length} />
          <StatPill label="Total hours" value={totalHours.toFixed(1)} />
          <StatPill label="Subjects" value={plan.subject_allocation.length} />
          <StatPill label="Mock tests" value={plan.schedule.filter((d) => d.type === "mock_test").length} />
        </div>
      </Card>

      <Card className="p-6 shadow-soft border-border/60">
        <h3 className="font-display text-lg font-semibold mb-4">Subject Allocation</h3>
        <div className="space-y-3">
          {plan.subject_allocation.map((s) => {
            const pct = totalHours > 0 ? (s.total_hours / totalHours) * 100 : 0;
            return (
              <div key={s.subject}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{s.subject}</span>
                  <span className="text-muted-foreground">{s.total_hours}h</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-primary transition-base" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="shadow-soft border-border/60 overflow-hidden">
        <div className="p-6 pb-3">
          <h3 className="font-display text-lg font-semibold">Day-by-Day Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Day</TableHead>
                <TableHead className="w-[110px]">Date</TableHead>
                <TableHead className="w-[130px]">Type</TableHead>
                <TableHead>Sessions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.schedule.map((day) => {
                const meta = typeMeta[day.type];
                const Icon = meta.icon;
                return (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">{day.day_label}</TableCell>
                    <TableCell className="text-muted-foreground">{day.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${meta.cls} gap-1 font-normal`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {day.sessions.length > 0 ? (
                        <div className="space-y-1">
                          {day.sessions.map((s, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium">{s.subject}:</span>{" "}
                              <span className="text-muted-foreground">{s.topic}</span>{" "}
                              <span className="text-xs text-muted-foreground">({s.duration_minutes}m)</span>
                            </div>
                          ))}
                          {day.notes && <div className="text-xs text-muted-foreground italic mt-1">{day.notes}</div>}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">{day.notes || "—"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

const StatPill = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
    <div className="text-2xl font-display font-bold">{value}</div>
    <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
  </div>
);
