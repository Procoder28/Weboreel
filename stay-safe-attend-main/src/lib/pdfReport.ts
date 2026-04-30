import jsPDF from "jspdf";
import type { AttendanceInputs, PredictionResult } from "./attendance";

export function downloadReportPdf(result: PredictionResult, inputs: AttendanceInputs) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AttendSmart AI", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Attendance Shortage Report", margin, y + 16);
  doc.setTextColor(0);

  y += 48;
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Inputs", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const inputRows: [string, string][] = [
    ["Total lectures conducted", String(inputs.total_classes)],
    ["Lectures attended", String(inputs.attended_classes)],
    ["Required %", `${inputs.required_percentage}%`],
    ["Upcoming lectures", String(inputs.remaining_classes)],
    ["Planned leaves", String(inputs.planned_leaves)],
  ];
  inputRows.forEach(([k, v]) => {
    doc.setTextColor(120);
    doc.text(k, margin, y);
    doc.setTextColor(0);
    doc.text(v, pageW - margin, y, { align: "right" });
    y += 16;
  });

  y += 16;
  doc.line(margin, y, pageW - margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Result", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const resultRows: [string, string][] = [
    ["Status", result.status],
    ["Current attendance", `${result.current_percentage.toFixed(2)}%`],
    ["Projected attendance", `${result.projected_percentage.toFixed(2)}%`],
    ["Classes needed", `${result.classes_needed}`],
    ["Classes you can skip", `${result.classes_can_skip}`],
    ["Weekly target", `${result.weekly_target} / week`],
    ["Weeks remaining", `${result.weeks_remaining}`],
  ];
  resultRows.forEach(([k, v]) => {
    doc.setTextColor(120);
    doc.text(k, margin, y);
    doc.setTextColor(0);
    doc.text(v, pageW - margin, y, { align: "right" });
    y += 16;
  });

  y += 16;
  doc.line(margin, y, pageW - margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Plan", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const wrapped = doc.splitTextToSize(result.plan, pageW - margin * 2);
  doc.text(wrapped, margin, y);
  y += wrapped.length * 14 + 24;

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    `Generated ${new Date().toLocaleString()}  ·  AttendSmart AI`,
    margin,
    doc.internal.pageSize.getHeight() - 32,
  );

  doc.save("attendsmart-report.pdf");
}
