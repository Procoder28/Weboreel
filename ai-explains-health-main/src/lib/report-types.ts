export type Status = "low" | "normal" | "high" | "unknown";

export interface ReportParameter {
  name: string;
  value: string;
  unit?: string;
  normalRange: string;
  rangeSource?: "report" | "general";
  status: Status;
  explanation: string;
  reasons: string[];
  tips: string[];
}

export interface ReportAnalysis {
  patientHints?: { ageRange?: string; sex?: string };
  summary: string;
  parameters: ReportParameter[];
  disclaimer: string;
}
