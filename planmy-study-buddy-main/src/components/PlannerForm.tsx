import { useState } from "react";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Difficulty, SubjectInput } from "@/lib/study-plan";

interface PlannerFormProps {
  loading: boolean;
  onSubmit: (data: {
    examDate: string;
    hoursPerDay: number;
    breakMinutes: number;
    subjects: SubjectInput[];
    syllabus: string;
  }) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export const PlannerForm = ({ loading, onSubmit }: PlannerFormProps) => {
  const today = new Date().toISOString().slice(0, 10);
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("4");
  const [breakMinutes, setBreakMinutes] = useState("10");
  const [syllabus, setSyllabus] = useState("");
  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { id: uid(), name: "", difficulty: "Medium" },
  ]);

  const updateSubject = (id: string, patch: Partial<SubjectInput>) =>
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubjects = subjects.filter((s) => s.name.trim().length > 0);
    if (!examDate || cleanSubjects.length === 0) return;
    onSubmit({
      examDate,
      hoursPerDay: Number(hoursPerDay),
      breakMinutes: Number(breakMinutes),
      subjects: cleanSubjects,
      syllabus: syllabus.trim(),
    });
  };

  return (
    <Card className="p-6 md:p-8 shadow-elegant border-border/60 bg-card/80 backdrop-blur">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exam-date">Exam date</Label>
            <Input
              id="exam-date"
              type="date"
              min={today}
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Daily study hours</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={16}
              step={0.5}
              required
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="break">Break between sessions (min)</Label>
            <Input
              id="break"
              type="number"
              min={0}
              max={60}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Subjects</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSubjects((prev) => [...prev, { id: uid(), name: "", difficulty: "Medium" }])}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {subjects.map((s, idx) => (
              <div key={s.id} className="flex gap-2 items-center animate-fade-in">
                <Input
                  placeholder={`Subject ${idx + 1} (e.g. Mathematics)`}
                  value={s.name}
                  onChange={(e) => updateSubject(s.id, { name: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={s.difficulty}
                  onValueChange={(v) => updateSubject(s.id, { difficulty: v as Difficulty })}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={subjects.length === 1}
                  onClick={() => setSubjects((prev) => prev.filter((p) => p.id !== s.id))}
                  aria-label="Remove subject"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="syllabus">Topics / syllabus (optional)</Label>
          <Textarea
            id="syllabus"
            placeholder="Paste your syllabus or list key topics per subject…"
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            rows={5}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-glow transition-base"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating your plan…
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" /> Generate Timetable
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
