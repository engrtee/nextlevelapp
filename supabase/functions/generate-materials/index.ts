// Edge Function: Tailoring engine. Generates a resume + cover letter for one
// listing, using the candidate profile, parsed CV text, and the job posting
// as context. Caches the result in generated_materials so re-opening a job
// doesn't re-spend an API call. Requires an authenticated caller.
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";
import { corsHeaders } from "../_shared/cors.ts";

const MODEL_ID = Deno.env.get("CLAUDE_MODEL") || "claude-opus-5";

const RESUME_MARKER = "### RESUME";
const COVER_LETTER_MARKER = "### COVER LETTER";

const SYSTEM_INSTRUCTIONS = `You are a resume and cover letter writer working for one specific \
candidate. You will be given (1) the candidate's persistent context profile, (2) their actual \
CV text, and (3) a specific job posting. Generate a tailored resume and a short tailored cover \
letter / application blurb for this posting.

Hard rules - these override any instinct to make the candidate look more impressive:
- Never invent or imply tools, employers, dates, titles, certifications, or metrics that are \
not present in the candidate profile or CV text provided below.
- Never claim a proficiency level (e.g. "production experience", "expert") beyond what the \
source material states.
- Anything under a "FUTURE ROADMAP" or explicitly marked not-yet-complete / in-progress in the \
candidate profile must NOT be presented as finished or production-grade work.
- Mirror the job posting's language and tool emphasis only where the candidate's real \
background genuinely supports it.
- Lead with concrete, quantified achievements already present in the source material.
- No generic filler phrases ("results-driven professional", "passionate about").

Output format - respond with exactly these two sections, in this order, with no other text \
before, between, or after them:

${RESUME_MARKER}
<plain-text resume tailored to this posting, ATS-friendly, no markdown tables or images>

${COVER_LETTER_MARKER}
<short tailored cover letter / application blurb, 3-5 short paragraphs>`;

function parseSections(text: string): { resume_text: string; cover_letter_text: string } {
  const idx = text.indexOf(RESUME_MARKER);
  const clIdx = text.indexOf(COVER_LETTER_MARKER);
  if (idx === -1 || clIdx === -1 || clIdx < idx) {
    return { resume_text: text.trim(), cover_letter_text: "" };
  }
  const resume = text.slice(idx + RESUME_MARKER.length, clIdx).trim();
  const coverLetter = text.slice(clIdx + COVER_LETTER_MARKER.length).trim();
  return { resume_text: resume, cover_letter_text: coverLetter };
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

  let body: { listing_id?: string; force_regenerate?: boolean };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!body.listing_id) {
    return new Response(JSON.stringify({ error: "listing_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  const db = createClient(supabaseUrl, serviceRoleKey);

  if (!body.force_regenerate) {
    const { data: cached } = await db
      .from("generated_materials")
      .select("*")
      .eq("listing_id", body.listing_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { data: listing, error: listingError } = await db
    .from("listings").select("*").eq("id", body.listing_id).maybeSingle();
  if (listingError || !listing) {
    return new Response(JSON.stringify({ error: "Listing not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await db.from("candidate_profile").select("content").eq("id", 1).maybeSingle();
  const { data: cv } = await db.from("candidate_cv").select("content").eq("id", 1).maybeSingle();

  if (!cv?.content) {
    return new Response(JSON.stringify({ error: "No CV uploaded yet - upload one in Candidate Profile first." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not set on the Supabase project." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });

  const userContent = `CANDIDATE CONTEXT PROFILE:
${profile?.content || ""}

---

CANDIDATE'S CV TEXT (parsed from uploaded file):
${cv.content}

---

JOB POSTING:
Title: ${listing.title || ""}
Company: ${listing.company || ""}
Country: ${listing.country || ""}
Visa route: ${listing.visa_route || ""}

${listing.description || ""}`;

  let text = "";
  try {
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 4096,
      system: SYSTEM_INSTRUCTIONS,
      messages: [{ role: "user", content: userContent }],
    });
    text = response.content.filter((b) => b.type === "text").map((b: any) => b.text).join("");
  } catch (error) {
    let message = "Unknown error calling the Anthropic API.";
    if (error instanceof Anthropic.AuthenticationError) message = "Invalid ANTHROPIC_API_KEY.";
    else if (error instanceof Anthropic.RateLimitError) message = "Rate limited by Anthropic API - try again shortly.";
    else if (error instanceof Anthropic.APIError) message = `API error (${error.status}): ${error.message}`;
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { resume_text, cover_letter_text } = parseSections(text);

  const { data: saved, error: saveError } = await db
    .from("generated_materials")
    .insert({ listing_id: body.listing_id, resume_text, cover_letter_text, model: MODEL_ID })
    .select()
    .single();

  if (saveError) {
    return new Response(JSON.stringify({ error: saveError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(saved), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
