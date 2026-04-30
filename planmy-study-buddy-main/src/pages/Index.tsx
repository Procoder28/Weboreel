import { useState } from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlannerForm } from "@/components/PlannerForm";
import { StudyPlanView } from "@/components/StudyPlanView";
import type { StudyPlan, SubjectInput } from "@/lib/study-plan";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [examDate, setExamDate] = useState("");

  const handleGenerate = async (data: {
    examDate: string;
    hoursPerDay: number;
    breakMinutes: number;
    subjects: SubjectInput[];
    syllabus: string;
  }) => {
    setLoading(true);
    setPlan(null);
    try {
      const { data: res, error } = await supabase.functions.invoke("generate-plan", {
        body: {
          exam_date: data.examDate,
          hours_per_day: data.hoursPerDay,
          break_minutes: data.breakMinutes,
          subjects: data.subjects.map((s) => ({ name: s.name, difficulty: s.difficulty })),
          syllabus: data.syllabus,
        },
      });

      if (error) {
        const ctx = (error as { context?: { status?: number } }).context;
        if (ctx?.status === 429) {
          toast.error("Too many requests — please wait a moment and try again.");
        } else if (ctx?.status === 402) {
          toast.error("AI credits exhausted. Please add credits to continue.");
        } else {
          toast.error(error.message || "Failed to generate plan");
        }
        return;
      }

      if (!res?.plan) {
        toast.error("No plan returned");
        return;
      }

      setExamDate(data.examDate);
      setPlan(res.plan as StudyPlan);
      toast.success("Your study plan is ready!");
      setTimeout(() => {
        document.getElementById("plan-output")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="container flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">StudySmart AI</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container pb-20">
        <section className="text-center max-w-3xl mx-auto pt-10 pb-10 md:pt-16 md:pb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by AI
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-5">
            Your personal{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">study planner</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Tell us your exam date, subjects, and how much time you have. Get a smart, day-by-day timetable in seconds.
          </p>
        </section>

        <div className="max-w-3xl mx-auto">
          <PlannerForm loading={loading} onSubmit={handleGenerate} />
        </div>

        {plan && (
          <div id="plan-output" className="max-w-5xl mx-auto mt-10 scroll-mt-6">
            <StudyPlanView plan={plan} examDate={examDate} />
          </div>
        )}
      </main>

      <footer className="container py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        Built with StudySmart AI · Personalized study plans, instantly.
      </footer>
    </div>
  );
};

export default Index;
