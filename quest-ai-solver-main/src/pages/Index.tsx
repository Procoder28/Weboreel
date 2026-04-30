import { useEffect, useState } from "react";
import { Brain, Sparkles, Zap, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DoubtForm } from "@/components/doubt/DoubtForm";
import { SolutionCard } from "@/components/doubt/SolutionCard";
import { HistoryList } from "@/components/doubt/HistoryList";
import type { DoubtRecord, Solution } from "@/components/doubt/types";
import heroBg from "@/assets/hero-bg.jpg";

const HISTORY_KEY = "doubtbuddy.history.v1";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<DoubtRecord | null>(null);
  const [history, setHistory] = useState<DoubtRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (items: DoubtRecord[]) => {
    setHistory(items);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  };

  const handleSolve = async (question: string, subject: string, level: string) => {
    setLoading(true);
    setCurrent(null);
    try {
      const { data, error } = await supabase.functions.invoke("solve", {
        body: { question, subject, level },
      });
      if (error) {
        const msg = (error as any)?.context?.status === 429
          ? "Too many requests. Please wait a moment."
          : (error as any)?.context?.status === 402
          ? "AI credits exhausted. Add credits in workspace settings."
          : error.message || "Failed to solve doubt";
        toast.error(msg);
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      const solution = data as Solution;
      const record: DoubtRecord = {
        id: crypto.randomUUID(),
        question, subject, level, solution,
        createdAt: Date.now(),
      };
      setCurrent(record);
      persist([record, ...history].slice(0, 5));
      toast.success("Doubt solved!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-glow animate-pulse-glow" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/85 to-background" />

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-hero grid place-items-center shadow-glow">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-lg leading-none">DoubtBuddy <span className="text-gradient">AI</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Your study companion</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground glass px-3 py-1.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI online
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-8 pb-12 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs font-medium mb-6 animate-fade-up">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Powered by Lovable AI
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight animate-fade-up">
          Solve any doubt in <span className="text-gradient">simple language</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto animate-fade-up">
          Type your question, pick a subject, and get a clear explanation with steps, examples, and key formulas — instantly.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6 animate-fade-up">
          <Pill icon={<Zap className="h-3.5 w-3.5" />}>Step-by-step</Pill>
          <Pill icon={<GraduationCap className="h-3.5 w-3.5" />}>School & College</Pill>
          <Pill icon={<Sparkles className="h-3.5 w-3.5" />}>Examples + formulas</Pill>
        </div>
      </section>

      {/* Main */}
      <main className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 max-w-5xl mx-auto">
          <div className="space-y-6 min-w-0">
            <DoubtForm onSubmit={handleSolve} loading={loading} />
            {current && (
              <SolutionCard
                solution={current.solution}
                question={current.question}
                subject={current.subject}
                level={current.level}
              />
            )}
          </div>
          <div className="space-y-6">
            <HistoryList
              items={history}
              onSelect={(it) => { setCurrent(it); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onClear={() => persist([])}
            />
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
        DoubtBuddy AI · Made for curious students 🧠
      </footer>
    </div>
  );
};

const Pill = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs font-medium text-foreground/85">
    <span className="text-accent">{icon}</span>
    {children}
  </span>
);

export default Index;
