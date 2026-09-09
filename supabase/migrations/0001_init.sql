-- Job Sponsorship Search & CV Tailoring Assistant - initial schema
-- Personal single-user tool: RLS restricts everything to authenticated users only.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- listings: List 1 - sourced & scored jobs, with tracking status
-- ---------------------------------------------------------------------------
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  source text not null,               -- 'adzuna' | 'greenhouse' | 'lever'
  external_id text not null,
  title text,
  company text,
  country text,
  url text,
  description text,
  salary_raw text,
  salary_status text,                 -- 'pass' | 'fail' | 'unclear'
  shortage_status text,                -- 'yes' | 'no' | 'unclear'
  tier int,
  score numeric,
  score_reason text,
  visa_route text,
  status text not null default 'New', -- 'New' | 'Viewed' | 'Applied' | 'Dismissed'
  date_found timestamptz not null default now(),
  date_applied timestamptz,
  unique (source, external_id)
);

create index if not exists idx_listings_status on listings (status);
create index if not exists idx_listings_score on listings (score desc);

-- ---------------------------------------------------------------------------
-- generated_materials: cached tailored resume/cover letter per listing,
-- so re-opening a job doesn't re-spend an API call
-- ---------------------------------------------------------------------------
create table if not exists generated_materials (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  resume_text text not null,
  cover_letter_text text not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_materials_listing on generated_materials (listing_id);

-- ---------------------------------------------------------------------------
-- candidate_profile: single-row editable document, used as tailoring context
-- ---------------------------------------------------------------------------
create table if not exists candidate_profile (
  id int primary key default 1 check (id = 1),
  content text not null default '',
  updated_at timestamptz not null default now()
);

insert into candidate_profile (id, content) values (1, '')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- candidate_cv: parsed CV text (persisted so it survives across sessions)
-- ---------------------------------------------------------------------------
create table if not exists candidate_cv (
  id int primary key default 1 check (id = 1),
  filename text,
  content text not null default '',
  updated_at timestamptz not null default now()
);

insert into candidate_cv (id, content) values (1, '')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- country_config: editable per-country visa/salary/scoring config
-- ---------------------------------------------------------------------------
create table if not exists country_config (
  country text primary key,
  tier int not null,
  visa_route text not null,
  salary_threshold numeric,
  salary_threshold_shortage numeric,
  currency text,
  period text,                        -- 'annual' | 'monthly'
  adzuna_code text,
  shortage_keywords text[] not null default '{}',
  source_note text,
  last_verified text
);

-- ---------------------------------------------------------------------------
-- companies: known Greenhouse/Lever employer boards to pull from directly
-- ---------------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  ats text not null check (ats in ('greenhouse', 'lever')),
  name text not null,
  token text not null,
  unique (ats, token)
);

-- ---------------------------------------------------------------------------
-- Row Level Security - authenticated users only (single-user personal tool)
-- ---------------------------------------------------------------------------
alter table listings enable row level security;
alter table generated_materials enable row level security;
alter table candidate_profile enable row level security;
alter table candidate_cv enable row level security;
alter table country_config enable row level security;
alter table companies enable row level security;

create policy "authenticated full access" on listings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on generated_materials
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on candidate_profile
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on candidate_cv
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on country_config
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on companies
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
