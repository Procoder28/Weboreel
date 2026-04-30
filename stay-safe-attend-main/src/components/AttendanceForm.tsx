import { useState } from "react";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AttendanceInputs, PredictionResult } from "@/lib/attendance";

const schema = z
  .object({
    total_classes: z.number().int().min(0).max(10000),
    attended_classes: z.number().int().min(0).max(10000),
    required_percentage: z.number().min(1).max(100),
    remaining_classes: z.number().int().min(0).max(10000),
    planned_leaves: z.number().int().min(0).max(10000),
  })
  .refine((d) => d.attended_classes <= d.total_classes, {
    message: "Attended cannot exceed total",
    path: ["attended_classes"],
  })
  .refine((d) => d.planned_leaves <= d.remaining_classes, {
    message: "Leaves cannot exceed remaining",
    path: ["planned_leaves"],
  });

interface Props {
  onResult: (r: PredictionResult, inputs: AttendanceInputs) => void;
}

export function AttendanceForm({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    total_classes: "",
    attended_classes: "",
    required_percentage: "75",
    remaining_classes: "",
    planned_leaves: "0",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({
      total_classes: Number(form.total_classes),
      attended_classes: Number(form.attended_classes),
      required_percentage: Number(form.required_percentage),
      remaining_classes: Number(form.remaining_classes),
      planned_leaves: Number(form.planned_leaves || 0),
    });

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast({ title: "Check your input", description: first.message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const inputs: AttendanceInputs = {
        total_classes: parsed.data.total_classes,
        attended_classes: parsed.data.attended_classes,
        required_percentage: parsed.data.required_percentage,
        remaining_classes: parsed.data.remaining_classes,
        planned_leaves: parsed.data.planned_leaves,
      };
      const { data, error } = await supabase.functions.invoke("predict-attendance", {
        body: inputs,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onResult(data as PredictionResult, inputs);
    } catch (err) {
      toast({
        title: "Prediction failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const fields: Array<{ key: keyof typeof form; label: string; hint: string; min?: number; max?: number; step?: string }> = [
    { key: "total_classes", label: "Total lectures conducted", hint: "So far this term" },
    { key: "attended_classes", label: "Lectures attended", hint: "Out of total above" },
    { key: "required_percentage", label: "Minimum required %", hint: "Default 75%", min: 1, max: 100, step: "0.1" },
    { key: "remaining_classes", label: "Upcoming lectures", hint: "Still to be conducted" },
    { key: "planned_leaves", label: "Planned leaves", hint: "Optional, default 0" },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor={f.key} className="font-mono text-xs uppercase tracking-widest">
                {f.label}
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">{f.hint}</span>
            </div>
            <Input
              id={f.key}
              type="number"
              inputMode="decimal"
              min={f.min ?? 0}
              max={f.max}
              step={f.step ?? "1"}
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder="0"
              className="rounded-none border-foreground/20 bg-transparent font-mono text-lg h-12 focus-visible:ring-accent focus-visible:border-foreground"
            />
          </div>
        ))}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono uppercase tracking-[0.2em] text-sm group"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2 transition-transform group-hover:rotate-12" />
            Check Attendance
          </>
        )}
      </Button>
    </form>
  );
}
