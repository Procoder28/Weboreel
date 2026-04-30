export type Difficulty = "Easy" | "Medium" | "Hard";

export interface SubjectInput {
  id: string;
  name: string;
  difficulty: Difficulty;
}

export interface PlanSession {
  subject: string;
  topic: string;
  duration_minutes: number;
}

export interface PlanDay {
  date: string;
  day_label: string;
  type: "study" | "revision" | "mock_test" | "rest";
  sessions: PlanSession[];
  notes: string;
}

export interface SubjectAllocation {
  subject: string;
  total_hours: number;
}

export interface StudyPlan {
  summary: string;
  subject_allocation: SubjectAllocation[];
  schedule: PlanDay[];
}
