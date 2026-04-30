import type { ReportAnalysis } from "./report-types";

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildSummaryText(fileName: string, r: ReportAnalysis): string {
  const lines: string[] = [];
  lines.push("MediExplain AI — Report Summary");
  lines.push("=".repeat(40));
  lines.push(`File: ${fileName}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push("Overview");
  lines.push("-".repeat(40));
  lines.push(r.summary);
  lines.push("");
  lines.push("Parameters");
  lines.push("-".repeat(40));
  r.parameters.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.name}`);
    lines.push(`   Value: ${p.value}${p.unit ? " " + p.unit : ""}`);
    lines.push(`   Normal range: ${p.normalRange}${p.rangeSource ? ` (${p.rangeSource})` : ""}`);
    lines.push(`   Status: ${statusLabel(p.status)}`);
    lines.push(`   What it means: ${p.explanation}`);
    if (p.reasons?.length) {
      lines.push(`   Possible general reasons:`);
      p.reasons.forEach((x) => lines.push(`     • ${x}`));
    }
    if (p.tips?.length) {
      lines.push(`   Lifestyle tips:`);
      p.tips.forEach((x) => lines.push(`     • ${x}`));
    }
    lines.push("");
  });
  lines.push("Disclaimer");
  lines.push("-".repeat(40));
  lines.push(r.disclaimer);
  return lines.join("\n");
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
