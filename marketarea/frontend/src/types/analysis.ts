export interface AnalysisRequest {
  lat: number;
  lng: number;
  radius: number;
  industry_code: string;
}

export interface RiskFlag {
  level: "warning" | "danger";
  message: string;
}

export interface AnalysisResult {
  health_score: number;
  competition_index: number;
  survival_probability: number;
  sales_estimate_low: number;
  sales_estimate_high: number;
  store_count: number;
  floating_population: number;
  resident_population: number;
  avg_rent_per_m2: number;
  population_score: number;
  floating_score: number;
  rent_score: number;
  risk_flags: RiskFlag[];
  grid_count: number;
}

export interface IndustryItem {
  code: string;
  name: string;
  category: string;
}
