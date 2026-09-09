export interface Listing {
  id: string;
  source: string;
  external_id: string;
  title: string | null;
  company: string | null;
  country: string | null;
  url: string | null;
  description: string | null;
  salary_raw: string | null;
  salary_status: "pass" | "fail" | "unclear" | null;
  shortage_status: "yes" | "no" | "unclear" | null;
  tier: number | null;
  score: number | null;
  score_reason: string | null;
  visa_route: string | null;
  status: "New" | "Viewed" | "Applied" | "Dismissed";
  date_found: string;
  date_applied: string | null;
}

export interface GeneratedMaterials {
  id: string;
  listing_id: string;
  resume_text: string;
  cover_letter_text: string;
  model: string | null;
  created_at: string;
}

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
  id: string;
  ats: "greenhouse" | "lever";
  name: string;
  token: string;
}
