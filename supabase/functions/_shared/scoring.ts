// Weighted composite scoring: skill match (40) > salary vs threshold (30) >
// shortage-occupation match (20) > country tier (10).
import type { CountryConfig, ScoredJob, SourcedJob } from "./types.ts";

const CANDIDATE_STACK_KEYWORDS = [
  "python", "sql", "airflow", "docker", "terraform", "dbt", "aws",
  "ci/cd", "github actions", "etl", "data warehouse", "postgresql",
  "data engineer", "analytics engineer", "data pipeline", "power bi",
  "azure", "data governance", "git",
];

const WEIGHTS = { skill: 40, salary: 30, shortage: 20, tier: 10 };

function textBlob(job: SourcedJob): string {
  return `${job.title} ${job.description}`.toLowerCase();
}

function skillMatchScore(job: SourcedJob): { score: number; hits: string[] } {
  const blob = textBlob(job);
  const hits = CANDIDATE_STACK_KEYWORDS.filter((kw) => blob.includes(kw));
  const ratio = hits.length / CANDIDATE_STACK_KEYWORDS.length;
  return { score: Math.round(ratio * WEIGHTS.skill * 10) / 10, hits };
}

function parseSalaryValue(salaryRaw: string | null): number | null {
  if (!salaryRaw) return null;
  const nums = (salaryRaw.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (nums.length === 0) return null;
  return Math.max(...nums);
}

function salaryScore(job: SourcedJob, country: CountryConfig): { score: number; status: "pass" | "fail" | "unclear" } {
  const threshold = country.salary_threshold;
  const value = parseSalaryValue(job.salary_raw);
  if (threshold == null || value == null) {
    return { score: WEIGHTS.salary * 0.4, status: "unclear" };
  }
  if (value >= threshold) return { score: WEIGHTS.salary, status: "pass" };
  return { score: 0, status: "fail" };
}

function shortageScore(job: SourcedJob, country: CountryConfig): { score: number; status: "yes" | "no" | "unclear" } {
  const blob = textBlob(job);
  if (!country.shortage_keywords || country.shortage_keywords.length === 0) {
    return { score: WEIGHTS.shortage * 0.4, status: "unclear" };
  }
  const matched = country.shortage_keywords.some((kw) => blob.includes(kw.toLowerCase()));
  return matched ? { score: WEIGHTS.shortage, status: "yes" } : { score: 0, status: "no" };
}

function tierScore(country: CountryConfig, tierWeights: Record<number, number>): number {
  const maxWeight = Math.max(...Object.values(tierWeights));
  const weight = tierWeights[country.tier] ?? tierWeights[3] ?? 3;
  return (weight / maxWeight) * WEIGHTS.tier;
}

export const TIER_WEIGHTS: Record<number, number> = { 1: 10, 2: 6, 3: 3 };

export function scoreJob(job: SourcedJob, country: CountryConfig): ScoredJob {
  const skill = skillMatchScore(job);
  const salary = salaryScore(job, country);
  const shortage = shortageScore(job, country);
  const tier = tierScore(country, TIER_WEIGHTS);

  const total = Math.round((skill.score + salary.score + shortage.score + tier) * 10) / 10;

  const reasonParts: string[] = [];
  if (skill.hits.length > 0) {
    reasonParts.push(`matches ${skill.hits.length} of your core skills (${skill.hits.slice(0, 4).join(", ")})`);
  }
  if (salary.status === "pass") reasonParts.push("salary clears the visa threshold");
  if (shortage.status === "yes") reasonParts.push("likely shortage-occupation match");
  if (country.tier === 1) reasonParts.push("Tier 1 target country");
  const reason = reasonParts.length > 0 ? reasonParts.join("; ") : "Weak match on available signals";

  return {
    ...job,
    score: total,
    score_reason: reason,
    salary_status: salary.status,
    shortage_status: shortage.status,
    tier: country.tier,
    visa_route: country.visa_route,
    country: country.country,
  };
}
