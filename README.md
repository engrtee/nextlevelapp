# Job Sponsorship Search & CV Tailoring Assistant

A personal tool that sources data engineering / analytics engineering / data platform
engineering roles offering visa sponsorship (prioritized by country), scores them against
your profile, and generates tailored resumes + cover letters using the Claude API. **It
sources and prepares only — it never auto-submits applications.**

- **Frontend:** React + TypeScript + Vite + Tailwind (`web/`)
- **Backend:** Supabase (Postgres + Auth + Edge Functions) (`supabase/`)

## Architecture

- **List 1 — Sourced & Scored**: pulled only from ToS-compliant sources (Adzuna's official
  API, and the public Greenhouse/Lever job-board APIs of known international-hiring
  employers). Each listing is scored (skill match > salary vs. threshold > shortage-occupation
  match > country tier) and cached in Postgres, deduped by `(source, external_id)`.
- **List 2 — Manual Search Links**: for LinkedIn/Indeed/Glassdoor/EURES (scraping-restricted
  or no simple public API) - generates pre-filtered clickable search URLs client-side. No job
  data is pulled for these.
- **Tailoring engine**: an Edge Function (`generate-materials`) calls the Anthropic API with
  (1) your `candidate_profile` document, (2) your parsed CV text, (3) the specific job
  posting, and a system prompt that explicitly forbids inventing tools, employers, dates, or
  metrics. Results are cached in `generated_materials` so re-opening a job doesn't re-spend an
  API call.
- **Tracking**: every listing shown gets a status (New/Viewed/Applied/Dismissed). Applied/
  Dismissed listings drop out of the daily List 1 view automatically.

API keys (Adzuna, Anthropic) live only as Supabase Edge Function secrets — never in the
frontend bundle.

## Setup

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then note your **Project URL**,
**anon key**, and **service role key** (Project Settings → API).

### 2. Apply the database schema

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from the repo root:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

This runs `supabase/migrations/0001_init.sql` (schema + RLS) and `0002_seed.sql` (country
config, known Greenhouse/Lever companies, and your candidate profile).

### 3. Create your login (PIN gate)

This is a single-user personal tool. Instead of a full email/password login, the app uses a
PIN screen backed by one fixed Supabase Auth account - real RLS-level protection, minimal
friction. In the Supabase dashboard, go to **Authentication → Users → Add user** and create
exactly one user: any email (e.g. `owner@job-assistant.local` - it never needs to receive
mail) and a password of your choice - that password is your PIN. Set the same email as
`VITE_OWNER_EMAIL` in step 6.

### 4. Set Edge Function secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set ADZUNA_APP_ID=your-adzuna-app-id
supabase secrets set ADZUNA_APP_KEY=your-adzuna-app-key
```

Get an Adzuna key free at [developer.adzuna.com](https://developer.adzuna.com/). Note: Adzuna
covers Germany, Netherlands, UK, Canada, Austria, Poland, Australia, and others, but **not**
Ireland, Sweden, or Denmark — for those, and for LinkedIn/Indeed/Glassdoor/EURES generally,
use List 2's generated search links instead.

Optional: `CLAUDE_MODEL` (defaults to `claude-opus-5`) to pin a different model.

### 5. Deploy the Edge Functions

```bash
supabase functions deploy source-jobs
supabase functions deploy generate-materials
```

### 6. Run the frontend

```bash
cd web
cp .env.example .env.local
# edit .env.local with your Project URL + anon key + VITE_OWNER_EMAIL from step 3
npm install
npm run dev
```

Open the printed local URL, enter the PIN (the password you set in step 3), upload your CV
under **Candidate Profile**, then click **Run sourcing now** on the Dashboard.

### 7. Deploy the frontend (optional)

`web/` is a standard Vite app — deploy to Vercel, Netlify, or Supabase's own static hosting.
Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_OWNER_EMAIL` as build-time env vars
on whatever host you use, and redeploy after adding/changing them - Vite bakes them in at
build time, not runtime.

## Keeping things current

- **Country salary thresholds / visa routes**: edit in the app under **Settings**, or directly
  in the `country_config` table. Values shipped in the seed migration are best-effort
  placeholders — each row's `source_note` links to where to verify the real current figure.
- **Greenhouse/Lever companies to pull from**: edit under **Settings**. A wrong board token
  just returns zero jobs for that company (fails safe).
- **Candidate profile**: edit directly in the app under **Candidate Profile** as your projects,
  certs, and experience progress. The generation prompt explicitly excludes anything under a
  "FUTURE ROADMAP" heading until you move it into the active section.

## Explicit non-goals

- No automated form-filling or application submission of any kind.
- No scraping of sites that prohibit it in their ToS (LinkedIn, Indeed, Glassdoor) — List 2's
  link-generation approach is used for these instead.
- No fabricated or inflated skills in generated resumes — enforced via the tailoring prompt.
- No storage of credentials for third-party job sites.

## Scheduling a daily run

Supabase doesn't run Edge Functions on a cron by itself. Options:
- Enable [`pg_cron`](https://supabase.com/docs/guides/database/extensions/pg_cron) + `pg_net`
  in your Supabase project to call the `source-jobs` function on a schedule.
- Or trigger it externally (GitHub Actions scheduled workflow, cron on a machine you control)
  with a POST to the function URL, authenticated as your user.
