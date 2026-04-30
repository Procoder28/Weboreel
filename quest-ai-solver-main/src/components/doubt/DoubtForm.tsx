import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SUBJECTS, LEVELS } from "./types";

type Props = {
  onSubmit: (q: string, subject: string, level: string) => void;
  loading: boolean;
};

export const DoubtForm = ({ onSubmit, loading }: Props) => {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState<string>("Math");
  const [level, setLevel] = useState<string>("School");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    onSubmit(question.trim(), subject, level);
  };

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-6 sm:p-8 shadow-card animate-fade-up">
      <div className="space-y-5">
        <div>
          <Label htmlFor="question" className="text-sm font-semibold mb-2 block">
            Your doubt
          </Label>
          <Textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Solve x² - 5x + 6 = 0 using the quadratic formula"
            className="min-h-[140px] resize-none bg-background/40 border-border text-base"
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground mt-1.5">{question.length}/2000</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="bg-background/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="bg-background/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !question.trim()}
          size="lg"
          className="w-full bg-gradient-hero hover:opacity-90 text-primary-foreground font-semibold text-base h-12 shadow-glow transition-all"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Solving your doubt...</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5" /> Solve Doubt</>
          )}
        </Button>
      </div>
    </form>
  );
};
