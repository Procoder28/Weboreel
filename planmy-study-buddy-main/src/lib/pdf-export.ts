import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StudyPlan } from "./study-plan";

export function exportPlanToPDF(plan: StudyPlan, examDate: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("StudySmart AI — Study Plan", 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Exam date: ${examDate}`, 40, 70);

  doc.setTextColor(40);
  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(plan.summary, pageWidth - 80);
  doc.text(summaryLines, 40, 95);

  let y = 95 + summaryLines.length * 14 + 10;

  autoTable(doc, {
    startY: y,
    head: [["Subject", "Total Hours"]],
    body: plan.subject_allocation.map((a) => [a.subject, a.total_hours.toString()]),
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 10 },
    margin: { left: 40, right: 40 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  const rows = plan.schedule.map((day) => [
    day.day_label,
    day.date,
    day.type.replace("_", " "),
    day.sessions.length
      ? day.sessions.map((s) => `${s.subject}: ${s.topic} (${s.duration_minutes}m)`).join("\n")
      : day.notes || "—",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Day", "Date", "Type", "Sessions"]],
    body: rows,
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9, cellPadding: 6, valign: "top" },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 70 },
      2: { cellWidth: 70 },
      3: { cellWidth: "auto" },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save("studysmart-plan.pdf");
}
