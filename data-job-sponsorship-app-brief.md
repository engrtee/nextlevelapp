# Project Brief: Job Sponsorship Search & CV Tailoring Assistant

## Goal
Build a personal tool that helps me find data engineering / analytics engineering / data platform engineering roles that offer visa sponsorship, prioritized by country, and generates tailored application materials for each match. The tool sources and prepares — it does NOT auto-submit applications.

## My Profile (for tailoring logic — edit/expand as needed)
- Background: Analytics/BI professional (Zenith Bank experience) transitioning into data engineering
- Core stack (hands-on, defensible in interviews): Python, SQL, Airflow, Docker, Terraform, dbt, AWS, CI/CD (GitHub Actions)
- Certifications: AWS Certified Data Engineer Associate (DEA-C01), dbt Analytics Engineering Certification, Databricks Generative AI Engineer Associate (in progress/planned)
- Portfolio projects: NYC taxi ETL pipeline (Airflow + Docker + Terraform + CI/CD), African economic intelligence platform (World Bank/IMF data, 5 African nations), agentic AI layer on top of data infrastructure
- Product-building credential: BizPulse (AI-powered SME profitability tracker) — use as interview narrative, not primary CV keyword match
- No UK/EU degree yet — relying on experience-based qualification routes where available (e.g., Germany's 3-years-experience IT specialist provision)
- Target titles: Data Engineer, Analytics Engineer, Data Platform Engineer (NOT generic DevOps — deprioritize unless posting explicitly covers data infra ownership)

## Country Priority Tiers (for scoring weight)
**Tier 1:** Germany (EU Blue Card), Ireland (Critical Skills Employment Permit), Netherlands (Highly Skilled Migrant)
**Tier 2:** Sweden, Denmark, Canada (Global Talent Stream), UK (Skilled Worker)
**Tier 3:** Spain, Portugal, Austria, Finland, Luxembourg, Poland, Australia (482 visa)

Maintain a config file/table with each country's current salary threshold(s), shortage-occupation classification rules, and visa route name, so thresholds can be updated as they change year to year without rewriting logic.

## Core Requirement: Two-List Daily Dashboard

### List 1 — Sourced & Scored (automated, from ToS-compliant sources only)
Pull listings ONLY from official APIs, RSS/job feeds, or sources that explicitly permit programmatic access:
- Adzuna API
- EURES (EU job mobility portal)
- Make it in Germany (official government portal for skilled workers)
- Company career-page feeds/APIs where available (e.g., Greenhouse, Lever job boards of known international-hiring employers: SAP, Zalando, Delivery Hero, N26, Celonis, Databricks, and similar — maintain this as an editable list)

For each listing, compute and display:
- **Score** (weighted composite): title/skill match to my stack > salary vs. that country's current threshold > shortage-occupation list match > country tier weight
- **Salary vs. threshold** (pass/fail/unclear if not disclosed)
- **Shortage-occupation match** (yes/no/unclear)
- **Country + visa route**
- Full job description
- **Tailored resume** (generated from my master profile, mirroring this posting's language/tools — see Tailoring Engine below)
- **Tailored short cover letter / application blurb**
- Direct application link
- One-line "why this scored well" explanation

Do not auto-submit anything. Output is for me to review and apply manually.

### List 2 — Manual Search Links (for scraping-restricted sites)
For LinkedIn, Indeed, Glassdoor, and any other site where scraping isn't permitted, generate pre-built, pre-filtered clickable search URLs instead of pulling job data:
- Direct site search URLs with filters pre-set (role variant + country + sponsorship-related keywords)
- Google search-operator links (e.g., `site:linkedin.com/jobs "data engineer" Germany "visa sponsorship"`) as clickable links
- Cover all title variants (Data Engineer / Analytics Engineer / Data Platform Engineer) × all Tier 1–2 countries × sponsorship keyword variants ("sponsorship", "relocation", "work permit")
- Rotate/refresh keyword combinations periodically so the list doesn't feel static
- This list shows ready-to-click search links only — no scraped job data, no scoring

## Tailoring Engine
- Maintain one master profile document (my real projects, certs, and skills, with honest depth notes — e.g., "production experience" vs. "working knowledge")
- Use the **Anthropic Claude API** to generate the tailored resume and cover letter for each match. Standard `/v1/messages` completion call — no special API key handling needed on my end.
- Context sources fed into each generation call:
  1. **My uploaded CV** (PDF/docx) — let me upload my actual CV as a file; parse and pass its content as context.
  2. **The `candidate-context-profile.md` document** (see companion file) — a full written profile of my background, narrative, skills, projects, certs, and target roles, meant to be included as system/context content on every generation call so the model consistently understands who I am without me re-explaining it per job.
  3. **The specific job posting text** being applied to.
- For each List 1 match, generate:
  - A downloadable resume file (PDF or docx) for ATS upload fields
  - A plain-text version of the same resume for ATS fields that require pasted text
  - A short tailored cover letter/application blurb
- Tailoring should mirror the specific posting's language and tool emphasis, but must never claim skills or experience levels beyond what's in my master profile or CV — no fabricated proficiency. Instruct the Claude API call explicitly not to invent tools, employers, dates, or metrics not present in the provided context.
- Let me review/edit the `candidate-context-profile.md` content directly in the app so I can keep it current as projects and certs progress.

## Tracking & Dedup
- Simple log (SQLite or spreadsheet) of every listing shown, with status: New / Viewed / Applied / Dismissed
- Once marked "Applied" or "Dismissed," exclude from future daily lists
- Track date applied for follow-up scheduling

## Schedule
- Run sourcing + scoring once daily (e.g., overnight or early morning)
- Dashboard should load the latest results without needing to know it's a "run" — just show current state

## Explicit Non-Goals
- No automated form-filling or application submission of any kind
- No scraping of sites that prohibit it in their ToS (LinkedIn, Indeed, Glassdoor, etc.) — use List 2's link-generation approach for these instead
- No fabricated or inflated skills in generated resumes
- No storage of credentials for third-party sites

## Deliverable
A working local app (dashboard-style UI is fine — Streamlit or simple web app) that I run daily, showing List 1 and List 2 as described above, with the tailoring engine wired to my master profile document.
