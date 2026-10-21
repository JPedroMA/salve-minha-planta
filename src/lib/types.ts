export type Lang = "pt" | "en";

export type Severity = "low" | "medium" | "high";

export type HealthStatus = "healthy" | "attention" | "critical";

export interface Issue {
  title: string;
  severity: Severity;
  cause: string;
  solution: string;
}

export interface CarePlan {
  water: string;
  light: string;
  soil: string;
  tip: string;
}

export interface DiagnosisResult {
  plant_name: string;
  scientific_name: string;
  confidence: number;
  health_status: HealthStatus;
  summary: string;
  issues: Issue[];
  care: CarePlan;
}

export interface DiagnoseResponse {
  result: DiagnosisResult;
  demo: boolean;
}

export interface StatsResponse {
  analyses: number;
  issuesFound: number;
}
