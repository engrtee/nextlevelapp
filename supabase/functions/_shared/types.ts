export interface CountryConfig {
  country: string;
  tier: number;
  visa_route: string;
  salary_threshold: number | null;
  salary_threshold_shortage: number | null;
  currency: string | null;
  period: string | null;
  adzuna_code: string | null;
  shortage_keywords: string[];
  source_note: string | null;
  last_verified: string | null;
}

export interface Company {
  ats: "greenhouse" | "lever";
  name: string;
  token: string;
}

export interface SourcedJob {
  source: string;
  external_id: string;
  title: string;
  company: string;
  url: string | null;
  description: string;
  salary_raw: string | null;
  location?: string;
  country?: string;
}

export interface ScoredJob extends SourcedJob {
  score: number;
  score_reason: string;
  salary_status: "pass" | "fail" | "unclear";
  shortage_status: "yes" | "no" | "unclear";
  tier: number;
  visa_route: string;
}
