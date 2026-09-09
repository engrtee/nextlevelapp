// Edge Function: List 1 sourcing. Pulls from Adzuna / Greenhouse / Lever,
// scores each result against country_config, and upserts new listings.
// Requires an authenticated caller (the owner) - protects API quota.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { scoreJob } from "../_shared/scoring.ts";
import { searchAdzuna, searchGreenhouse, searchLever } from "../_shared/sources.ts";
import type { CountryConfig, Company, ScoredJob, SourcedJob } from "../_shared/types.ts";

const SEARCH_TERMS = ["data engineer", "analytics engineer", "data platform engineer"];

function attributeCountry(job: SourcedJob, countries: CountryConfig[]): string | null {
  const location = (job.location || "").toLowerCase();
  for (const c of countries) {
    if (location.includes(c.country.toLowerCase())) return c.country;
  }
  return null;
}

// `location` is only used transiently to guess the country above - the
// listings table has no such column, so it must not reach the insert.
function toListingRow(scored: ScoredJob) {
  const { location, ...rest } = scored;
  return { ...rest, status: "New" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify the caller is an authenticated user before spending API quota.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Service-role client for reads/writes bypassing RLS (already auth-gated above).
  const db = createClient(supabaseUrl, serviceRoleKey);

  const { data: countries, error: countriesError } = await db.from("country_config").select("*");
  if (countriesError) {
    return new Response(JSON.stringify({ error: countriesError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: companies } = await db.from("companies").select("*");

  const countryByName = new Map<string, CountryConfig>(
    (countries as CountryConfig[]).map((c) => [c.country, c]),
  );

  const adzunaAppId = Deno.env.get("ADZUNA_APP_ID");
  const adzunaAppKey = Deno.env.get("ADZUNA_APP_KEY");

  const summary = { adzuna: 0, greenhouse: 0, lever: 0, skipped_no_country_match: 0, errors: [] as string[] };
  const toInsert: any[] = [];

  // Adzuna: one query per (country with adzuna_code, search term)
  if (adzunaAppId && adzunaAppKey) {
    for (const country of countries as CountryConfig[]) {
      if (!country.adzuna_code) continue;
      for (const term of SEARCH_TERMS) {
        const jobs = await searchAdzuna(country.adzuna_code, term, adzunaAppId, adzunaAppKey);
        for (const job of jobs) {
          const scored = scoreJob(job, country);
          toInsert.push(toListingRow(scored));
          summary.adzuna++;
        }
      }
    }
  } else {
    summary.errors.push("ADZUNA_APP_ID / ADZUNA_APP_KEY not set - Adzuna sourcing skipped.");
  }

  // Greenhouse / Lever: company-wide pull, attribute country from location text
  for (const entry of (companies as Company[]) || []) {
    const jobs = entry.ats === "greenhouse"
      ? await searchGreenhouse(entry.name, entry.token)
      : await searchLever(entry.name, entry.token);

    for (const job of jobs) {
      const countryName = attributeCountry(job, countries as CountryConfig[]);
      const country = countryName ? countryByName.get(countryName) : null;
      if (!country) {
        summary.skipped_no_country_match++;
        continue;
      }
      const scored = scoreJob(job, country);
      toInsert.push(toListingRow(scored));
      if (entry.ats === "greenhouse") summary.greenhouse++;
      else summary.lever++;
    }
  }

  if (toInsert.length > 0) {
    // Dedup on (source, external_id); ignore rows already seen.
    const { error: insertError } = await db
      .from("listings")
      .upsert(toInsert, { onConflict: "source,external_id", ignoreDuplicates: true });
    if (insertError) summary.errors.push(insertError.message);
  }

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
