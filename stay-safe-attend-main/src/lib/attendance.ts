export interface PredictionResult {
  current_percentage: number;
  projected_percentage: number;
  status: "Safe" | "Shortage" | "At Risk";
  classes_needed: number;
  classes_can_skip: number;
  remaining_classes: number;
  final_total: number;
  weekly_target: number;
  weeks_remaining: number;
  plan: string;
}

export interface AttendanceInputs {
  total_classes: number;
  attended_classes: number;
  required_percentage: number;
  remaining_classes: number;
  planned_leaves: number;
}
