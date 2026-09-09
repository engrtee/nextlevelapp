// ToS-compliant job source connectors: Adzuna's official API, and the public
// Greenhouse / Lever job board APIs (companies' own public postings feeds).
import type { SourcedJob } from "./types.ts";

export async function searchAdzuna(
  countryCode: string,
  what: string,
  appId: string,
  appKey: string,
  maxPages = 2,
): Promise<SourcedJob[]> {
  const results: SourcedJob[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`);
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("what", what);
    url.searchParams.set("results_per_page", "20");
    url.searchParams.set("content-type", "application/json");

    let data: any;
    try {
      const resp = await fetch(url.toString());
      if (!resp.ok) break;
      data = await resp.json();
    } catch {
      break;
    }

    const items = data.results || [];
    if (items.length === 0) break;

    for (const r of items) {
      const salaryMin = r.salary_min;
      const salaryMax = r.salary_max;
      const salaryRaw = salaryMin || salaryMax ? `${salaryMin ?? ""}-${salaryMax ?? ""}` : null;
      results.push({
        source: "adzuna",
        external_id: String(r.id),
        title: (r.title || "").trim(),
        company: r.company?.display_name || "Unknown",
        url: r.redirect_url || null,
        description: r.description || "",
        salary_raw: salaryRaw,
        location: r.location?.display_name || "",
      });
    }
  }
  return results;
}

export async function searchGreenhouse(companyName: string, token: string): Promise<SourcedJob[]> {
  try {
    const resp = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.jobs || []).map((job: any) => ({
      source: "greenhouse",
      external_id: String(job.id),
      title: (job.title || "").trim(),
      company: companyName,
      url: job.absolute_url || null,
      description: job.content || "",
      salary_raw: null,
      location: job.location?.name || "",
    }));
  } catch {
    return [];
  }
}

export async function searchLever(companyName: string, token: string): Promise<SourcedJob[]> {
  try {
    const resp = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data || []).map((job: any) => ({
      source: "lever",
      external_id: String(job.id),
      title: (job.text || "").trim(),
      company: companyName,
      url: job.hostedUrl || null,
      description: job.descriptionPlain || job.description || "",
      salary_raw: null,
      location: job.categories?.location || "",
    }));
  } catch {
    return [];
  }
}
