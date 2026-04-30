import { useState } from "react";
import { Apple, Sparkles, Moon, Sun, Loader2, Download, Activity, Droplet, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

type DietForm = {
  age: string;
  gender: string;
  weight: string;
  height: string;
  goal: string;
  activity: string;
  diet_type: string;
};

type PlanSlot = { calories: number; items: string[] };
type PlanResult = {
  bmi: number;
  bmi_category: string;
  calories: number;
  water_liters: number;
  diet_plan: {
    breakfast: PlanSlot;
    lunch: PlanSlot;
    snacks: PlanSlot;
    dinner: PlanSlot;
    exercise: { routine: string; duration_minutes: number };
    tips: string[];
  };
};

const Index = () => {
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [form, setForm] = useState<DietForm>({
    age: "", gender: "male", weight: "", height: "",
    goal: "maintain", activity: "medium", diet_type: "veg",
  });

  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const update = (k: keyof DietForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    const age = Number(form.age), weight = Number(form.weight), height = Number(form.height);
    if (!age || age < 10 || age > 100) return toast.error("Enter a valid age (10-100)");
    if (!weight || weight < 25 || weight > 300) return toast.error("Enter a valid weight (25-300 kg)");
    if (!height || height < 100 || height > 250) return toast.error("Enter a valid height (100-250 cm)");

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("diet-plan", {
        body: { age, gender: form.gender, weight, height, goal: form.goal, activity: form.activity, diet_type: form.diet_type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast.success("Your personalized plan is ready!");
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const p = result.diet_plan;
    let y = 20;
    doc.setFontSize(22); doc.setTextColor(34, 139, 80);
    doc.text("FitDiet AI - Personalized Plan", 20, y); y += 12;
    doc.setFontSize(11); doc.setTextColor(60, 60, 60);
    doc.text(`BMI: ${result.bmi} (${result.bmi_category})`, 20, y); y += 7;
    doc.text(`Daily Calories: ${result.calories} kcal`, 20, y); y += 7;
    doc.text(`Water Intake: ${result.water_liters} L`, 20, y); y += 12;

    const slot = (title: string, s: PlanSlot) => {
      doc.setFontSize(14); doc.setTextColor(34, 139, 80);
      doc.text(`${title} (${s.calories} kcal)`, 20, y); y += 7;
      doc.setFontSize(11); doc.setTextColor(40, 40, 40);
      s.items.forEach((it) => { doc.text(`• ${it}`, 25, y); y += 6; });
      y += 4;
    };
    slot("Breakfast", p.breakfast);
    slot("Lunch", p.lunch);
    slot("Snacks", p.snacks);
    slot("Dinner", p.dinner);

    doc.setFontSize(14); doc.setTextColor(34, 139, 80);
    doc.text("Exercise", 20, y); y += 7;
    doc.setFontSize(11); doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(`${p.exercise.routine} (${p.exercise.duration_minutes} min)`, 170);
    doc.text(lines, 20, y); y += lines.length * 6 + 4;

    doc.setFontSize(14); doc.setTextColor(34, 139, 80);
    doc.text("Tips", 20, y); y += 7;
    doc.setFontSize(11); doc.setTextColor(40, 40, 40);
    p.tips.forEach((t) => {
      const tl = doc.splitTextToSize(`• ${t}`, 170);
      doc.text(tl, 20, y); y += tl.length * 6;
    });
    doc.save("fitdiet-plan.pdf");
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="gradient-hero p-2 rounded-xl shadow-glow">
            <Apple className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">FitDiet<span className="text-gradient">AI</span></span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      {/* Hero */}
      <section className="container py-10 md:py-16 text-center max-w-3xl mx-auto animate-fade-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm mb-6">
          <Sparkles className="h-4 w-4 text-accent" />
          AI-powered nutrition coach
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
          Your personal <span className="text-gradient">diet plan</span>,<br />generated in seconds.
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Get a science-based meal plan, calorie target, and workout — tailored to your body and goals.
        </p>
      </section>

      {/* Form */}
      <section className="container max-w-3xl pb-16">
        <Card className="p-6 md:p-8 gradient-card border-2 shadow-soft animate-fade-up">
          <h2 className="text-2xl font-bold mb-6">Tell us about you</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" placeholder="28" value={form.age} onChange={(e) => update("age", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" placeholder="70" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input id="height" type="number" placeholder="175" value={form.height} onChange={(e) => update("height", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Select value={form.goal} onValueChange={(v) => update("goal", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="loss">Weight Loss</SelectItem>
                  <SelectItem value="maintain">Maintain</SelectItem>
                  <SelectItem value="gain">Weight Gain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select value={form.activity} onValueChange={(v) => update("activity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Food Preference</Label>
              <Select value={form.diet_type} onValueChange={(v) => update("diet_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={loading}
            size="lg"
            className="w-full mt-8 gradient-hero text-primary-foreground hover:opacity-90 shadow-glow text-base font-semibold h-14 transition-smooth"
          >
            {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Crafting your plan...</>) :
              (<><Sparkles className="mr-2 h-5 w-5" /> Generate My Diet Plan</>)}
          </Button>
        </Card>
      </section>

      {/* Results */}
      {result && (
        <section id="results" className="container max-w-5xl pb-20 animate-fade-up">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-3xl font-bold">Your plan</h2>
            <Button onClick={downloadPDF} variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="p-5 gradient-card shadow-soft border-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
                <span className="text-sm text-muted-foreground">BMI</span>
              </div>
              <div className="text-3xl font-bold">{result.bmi}</div>
              <div className="text-sm text-muted-foreground mt-1">{result.bmi_category}</div>
            </Card>
            <Card className="p-5 gradient-card shadow-soft border-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent/10"><Flame className="h-5 w-5 text-accent" /></div>
                <span className="text-sm text-muted-foreground">Daily Calories</span>
              </div>
              <div className="text-3xl font-bold">{result.calories}</div>
              <div className="text-sm text-muted-foreground mt-1">kcal / day</div>
            </Card>
            <Card className="p-5 gradient-card shadow-soft border-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10"><Droplet className="h-5 w-5 text-primary" /></div>
                <span className="text-sm text-muted-foreground">Water</span>
              </div>
              <div className="text-3xl font-bold">{result.water_liters} L</div>
              <div className="text-sm text-muted-foreground mt-1">recommended</div>
            </Card>
          </div>

          {/* Meals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {(["breakfast", "lunch", "snacks", "dinner"] as const).map((meal) => {
              const s = result.diet_plan[meal];
              return (
                <Card key={meal} className="p-6 gradient-card shadow-soft border-2 hover:shadow-glow transition-smooth">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold capitalize">{meal}</h3>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full gradient-accent text-accent-foreground">
                      {s.calories} kcal
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {s.items.map((it, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-primary font-bold">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>

          {/* Exercise + Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 gradient-card shadow-soft border-2">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-5 w-5 text-accent" />
                <h3 className="text-xl font-bold">Exercise</h3>
              </div>
              <p className="text-sm leading-relaxed">{result.diet_plan.exercise.routine}</p>
              <div className="mt-3 text-sm font-semibold text-primary">
                Duration: {result.diet_plan.exercise.duration_minutes} min
              </div>
            </Card>
            <Card className="p-6 gradient-card shadow-soft border-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-accent" />
                <h3 className="text-xl font-bold">Coach tips</h3>
              </div>
              <ul className="space-y-2">
                {result.diet_plan.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      )}

      <footer className="container py-8 text-center text-sm text-muted-foreground">
        Built with 🥦 by FitDiet AI · Not medical advice — consult a professional.
      </footer>
    </main>
  );
};

export default Index;
