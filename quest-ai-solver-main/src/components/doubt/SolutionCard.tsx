import { Copy, Download, FileText, BookOpen, ListOrdered, Lightbulb, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import type { Solution } from "./types";

type Props = {
  solution: Solution;
  question: string;
  subject: string;
  level: string;
};

const formatPlain = (s: Solution, q: string, subj: string, lvl: string) => {
  return `DoubtBuddy AI — Solution
========================

Subject: ${subj}    Level: ${lvl}

Question:
${q}

Explanation:
${s.answer}

${s.steps ? `Step-by-step:\n${s.steps}\n\n` : ""}Examples:
${s.examples.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Key Points:
${s.key_points.map((k) => `• ${k}`).join("\n")}
`;
};

export const SolutionCard = ({ solution, question, subject, level }: Props) => {
  const copyAll = async () => {
    await navigator.clipboard.writeText(formatPlain(solution, question, subject, level));
    toast.success("Copied to clipboard");
  };

  const downloadTxt = () => {
    const blob = new Blob([formatPlain(solution, question, subject, level)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doubtbuddy-solution-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as TXT");
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const writeBlock = (text: string, size: number, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((ln: string) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(ln, margin, y);
        y += size * 1.35;
      });
    };

    writeBlock("DoubtBuddy AI — Solution", 18, true);
    y += 6;
    writeBlock(`Subject: ${subject}    Level: ${level}`, 10);
    y += 6;
    writeBlock("Question", 12, true);
    writeBlock(question, 11);
    y += 8;
    writeBlock("Explanation", 12, true);
    writeBlock(solution.answer, 11);
    y += 8;
    if (solution.steps) {
      writeBlock("Step-by-step", 12, true);
      writeBlock(solution.steps, 11);
      y += 8;
    }
    writeBlock("Examples", 12, true);
    solution.examples.forEach((e, i) => writeBlock(`${i + 1}. ${e}`, 11));
    y += 8;
    writeBlock("Key Points", 12, true);
    solution.key_points.forEach((k) => writeBlock(`• ${k}`, 11));

    doc.save(`doubtbuddy-solution-${Date.now()}.pdf`);
    toast.success("Downloaded as PDF");
  };

  return (
    <article className="glass rounded-2xl p-6 sm:p-8 shadow-card animate-fade-up space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-hero grid place-items-center shadow-glow">
            <Lightbulb className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Solution</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyAll}><Copy className="h-4 w-4 mr-1.5" /> Copy</Button>
          <Button variant="outline" size="sm" onClick={downloadTxt}><FileText className="h-4 w-4 mr-1.5" /> TXT</Button>
          <Button variant="outline" size="sm" onClick={downloadPdf}><Download className="h-4 w-4 mr-1.5" /> PDF</Button>
        </div>
      </header>

      <Section icon={<BookOpen className="h-4 w-4" />} title="Simple explanation">
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{solution.answer}</p>
      </Section>

      {solution.steps && (
        <Section icon={<ListOrdered className="h-4 w-4" />} title="Step-by-step">
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-background/40 rounded-lg p-4 border border-border">
            {solution.steps}
          </p>
        </Section>
      )}

      <Section icon={<Lightbulb className="h-4 w-4" />} title="Examples">
        <div className="space-y-3">
          {solution.examples.map((ex, i) => (
            <div key={i} className="flex gap-3 bg-background/40 rounded-lg p-4 border border-border">
              <div className="shrink-0 h-7 w-7 rounded-lg bg-primary/20 text-primary grid place-items-center font-bold text-sm">
                {i + 1}
              </div>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{ex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Key className="h-4 w-4" />} title="Key points">
        <ul className="space-y-2">
          {solution.key_points.map((k, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <span className="text-foreground/90 leading-relaxed">{k}</span>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
};

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      <span className="text-accent">{icon}</span> {title}
    </h3>
    {children}
  </section>
);
