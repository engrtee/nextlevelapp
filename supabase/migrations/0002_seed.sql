-- Seed data: country config, known ATS company boards, and the candidate profile.
-- Country thresholds are best-effort placeholders (verify against source_note before
-- relying on salary pass/fail scoring for a real decision) - edit this table any time
-- via the Settings page, no code changes needed.

insert into country_config
  (country, tier, visa_route, salary_threshold, salary_threshold_shortage, currency, period, adzuna_code, shortage_keywords, source_note, last_verified)
values
  ('Germany', 1, 'EU Blue Card', 45300, 41041, 'EUR', 'annual', 'de',
   array['data engineer','software engineer','developer','IT specialist','data scientist','cloud engineer'],
   'Verify at make-it-in-germany.com/en/visa-residence/types/eu-blue-card', '2025-01-01 (placeholder - re-verify)'),

  ('Ireland', 1, 'Critical Skills Employment Permit', 38000, 32000, 'EUR', 'annual', null,
   array['data engineer','data analyst','software developer','ICT','data scientist'],
   'Verify at enterprise.gov.ie - Critical Skills Occupations List', '2025-01-01 (placeholder - re-verify)'),

  ('Netherlands', 1, 'Highly Skilled Migrant', 63973, 46908, 'EUR', 'annual', 'nl',
   array['data engineer','data analyst','software engineer','IT'],
   'Verify at ind.nl - Highly Skilled Migrant salary criteria (age-dependent)', '2025-01-01 (placeholder - re-verify)'),

  ('Sweden', 2, 'Work Permit (salary threshold reform)', 34200, null, 'SEK', 'monthly', null,
   array['data engineer','software developer','IT','data'],
   'Verify at migrationsverket.se - work permit salary requirement', '2025-01-01 (placeholder - re-verify)'),

  ('Denmark', 2, 'Pay Limit Scheme', 465000, null, 'DKK', 'annual', null,
   array['data engineer','software developer','IT','data'],
   'Verify at nyidanmark.dk - Pay Limit Scheme threshold', '2025-01-01 (placeholder - re-verify)'),

  ('Canada', 2, 'Global Talent Stream', null, null, 'CAD', 'annual', 'ca',
   array['data engineer','software developer','IT','tech'],
   'GTS uses prevailing wage per NOC code, not a flat threshold - verify at canada.ca', '2025-01-01 (placeholder - re-verify)'),

  ('UK', 2, 'Skilled Worker', 38700, 30960, 'GBP', 'annual', 'gb',
   array['data engineer','software developer','IT','data'],
   'Verify at gov.uk - Skilled Worker visa salary requirements', '2025-01-01 (placeholder - re-verify)'),

  ('Spain', 3, 'Highly Qualified Professional Permit', null, null, 'EUR', 'annual', null,
   array['data engineer','IT','software'],
   'Verify at extranjeros.inclusion.gob.es', '2025-01-01 (placeholder - re-verify)'),

  ('Portugal', 3, 'D3 / Highly Qualified Activity Visa', null, null, 'EUR', 'annual', null,
   array['data engineer','IT','software'],
   'Verify at vistos.mne.gov.pt', '2025-01-01 (placeholder - re-verify)'),

  ('Austria', 3, 'Red-White-Red Card', null, null, 'EUR', 'annual', 'at',
   array['data engineer','IT','software'],
   'Verify at migration.gv.at', '2025-01-01 (placeholder - re-verify)'),

  ('Finland', 3, 'Residence Permit for Specialist', null, null, 'EUR', 'annual', null,
   array['data engineer','IT','software'],
   'Verify at migri.fi', '2025-01-01 (placeholder - re-verify)'),

  ('Luxembourg', 3, 'EU Blue Card / Highly Qualified Worker Permit', null, null, 'EUR', 'annual', null,
   array['data engineer','IT','software'],
   'Verify at guichet.public.lu', '2025-01-01 (placeholder - re-verify)'),

  ('Poland', 3, 'Work Permit (Type A)', null, null, 'PLN', 'annual', 'pl',
   array['data engineer','IT','software'],
   'Verify at gov.pl - foreigner work permits', '2025-01-01 (placeholder - re-verify)'),

  ('Australia', 3, 'Subclass 482 (Skills in Demand)', 73150, null, 'AUD', 'annual', 'au',
   array['data engineer','software developer','IT','data'],
   'Verify at immi.homeaffairs.gov.au - Core Skills Income Threshold', '2025-01-01 (placeholder - re-verify)')
on conflict (country) do nothing;

insert into companies (ats, name, token) values
  ('greenhouse', 'Zalando', 'zalando'),
  ('greenhouse', 'Celonis', 'celonis'),
  ('greenhouse', 'Databricks', 'databricks'),
  ('greenhouse', 'N26', 'n26'),
  ('lever', 'Delivery Hero', 'deliveryhero')
on conflict (ats, token) do nothing;

update candidate_profile set content = $$# Candidate Context Profile

**Name:** Tosin Oladapo Ilesanmi

Use this document as persistent context for every resume and cover letter generation call, combined with (1) the actual CV file and (2) the specific job posting text. Do not invent tools, employers, dates, metrics, or proficiency levels not present in this document or the CV.

**CRITICAL — two-tier structure below: only the ACTIVE PROFILE section may be used for resume/cover letter generation. The FUTURE ROADMAP section is explicitly excluded from generation until items are marked complete.**

---

## ACTIVE PROFILE (use this for all resume/cover letter generation)

### Identity & Career Narrative
Senior data professional based in Lagos, Nigeria, with 8 years of experience spanning banking and consulting. Currently Data Analyst and RPA Consultant at Deloitte (Sept 2022–present); previously Data Analyst and IT Support Engineer at Zenith Bank PLC (May 2017–Aug 2022). Holds an MSc in Information Technology (University of Lagos) and a BEng in Electrical Electronics Engineering (Madonna University). Transitioning career focus toward Data Engineer / Analytics Engineer / Data Platform Engineer roles abroad via visa sponsorship (priority: Germany, Ireland, Netherlands; secondary: Sweden, Denmark, Canada, UK).

Has an existing personal connection in Dartford, United Kingdom (not a right-to-work basis — a personal connection only; do not imply UK work authorization in any generated content).

**Positioning note**: 8 years of experience plus an MSc clears the "5 years' experience" and "bachelor's degree" bars that most Data Engineer postings ask for (confirmed against a real posting reviewed — Moniepoint's Senior Data Engineer listing). This candidate can realistically target mid-to-senior titled roles, not only entry-level sponsored positions. The MSc also reduces reliance on Germany's no-degree/3-years-experience provision, since the degree requirement is independently satisfied.

### Professional Experience

**Deloitte and Touche Tomatsu — Data Analyst and RPA Consultant (Data Engineering-Focused), Lagos, Nigeria (Sept 2022–present)**

*Note on framing: this heading is an honest functional descriptor, not a title change — "Data Analyst and RPA Consultant" remains the verifiable employer-recorded title. The bullets below are ordered to lead with engineering work first, since that's the substantively accurate emphasis of the role.*

- Designed and implemented Python ETL pipelines with full Git integration, version control, branching strategies, and CI/CD readiness, automating financial and operational data workflows.
- Led ground-up design of Reconiq, a bank reconciliation and month-end close automation solution now in active production use with growing external commercial interest.
- Led a 3-person team building a supplier reconciliation solution on Power Platform, cutting manual effort from 3 days to minutes (70%+ efficiency gain).
- Designed and orchestrated SQL and Python-based data pipelines, automating manual processes and achieving 80% efficiency gains.
- Developed and enforced data governance frameworks, ensuring accuracy, completeness, and compliance across data pipelines.
- Developed executive dashboards integrating multiple data sources for Banking, Oil & Gas, and Telecom clients; built CFO dashboards using JavaScript for top bank executives.
- Led end-to-end projects from scoping through delivery; mentored junior analysts and RPA developers; delivered SQL/Python/Power BI training internally.
- **Key achievements**: Built a 26-dashboard ALCO reporting solution in Power BI for a leading African bank (75% process efficiency improvement). Led development of an Enterprise Risk Reporting Analytics solution unifying disparate data sources, resulting in multi-million-dollar cost savings. Built a real-time working capital dashboard achieving a 40% improvement in collection efficiency and 30%+ increase in working capital revenue. Automated risk-related processes with UiPath, SQL, Python, and Excel VBA, saving $100,000+ in man-hours.

**Data engineering trajectory (forward-looking — mention only as active momentum, never as completed work):** Currently deepening data engineering skills through the Core Data Engineers bootcamp (hands-on, Airflow-centered curriculum), building an end-to-end NYC taxi data pipeline as the parallel capstone project (in progress, not yet complete). An upcoming work assignment is expected to formally expand data engineering responsibilities further — reference this only as "actively expanding into a dedicated data engineering initiative" in cover letters, since it has not started yet.

**Zenith Bank PLC — Data Analyst and IT Support Engineer, Lagos, Nigeria (May 2017–Aug 2022)**
- Created interactive dashboards and visualizations to communicate KPIs to stakeholders; conducted exploratory data analysis and root cause analysis; defined and tracked key performance metrics; generated reports for technical and non-technical audiences.
- **Key achievements**: Reduced card printer failure rate from 9.75 to 2 per month (26.4% yearly increase in cards printed). Built interactive Power BI dashboards contributing to a profit increase of over $4,000,000.

### Skills (real, from CV — safe to list and defend in interviews)
- **Data Analysis & Modeling**: SQL, Python
- **Data Engineering & ETL**: ETL pipelines, Data Warehousing, PostgreSQL, Docker, Linux
- **Data Visualization**: Power BI, JavaScript dashboards (CFO-level)
- **Automation & Workflow**: UiPath, Process Automation
- **Cloud & Platforms**: AWS, Azure (working knowledge — not yet certified in AWS; Azure is certified, see below)
- **Database Management**: SQL Server, PostgreSQL, Data Governance, Data Quality
- **Project & Process Management**: Agile, Git

### Certifications (actually held)
- Azure Data Engineering (DP-203) — June 2022
- Analyzing Data with Power BI (PL-300) — November 2023

### Education
- MSc Information Technology — University of Lagos, Jan 2023
- Nano Degree, Data Analytics — Udacity, Nov 2022
- BEng Electrical Electronics Engineering — Madonna University, Aug 2014

### Existing Personal Projects
- **Full Data Warehouse Implementation**: Built a complete data warehouse using pure SQL for modeling (bronze/silver/gold layers) and Python for ingestion. Docker and Airflow automation is a planned next step, not yet implemented — do not describe this project as using Docker/Airflow in generated content.
- **CSV-to-MySQL Pipeline**: End-to-end data engineering project using Python, ingesting data from a CSV file into a MySQL database.

### Currently In Progress (mention only as "in progress," never as completed)
- **NYC Taxi Data Pipeline**: Started, not yet complete. Do not describe specific tools, architecture, or outcomes as finished or production-grade until confirmed complete — refer to it only as "currently building an end-to-end taxi trip data pipeline" without further technical claims until status is updated here.

---

## FUTURE ROADMAP (NOT started — exclude entirely from resume/cover letter generation until moved to ACTIVE PROFILE)

These are aspirational goals only. None of the following should appear in any generated resume, cover letter, or application material in any form:
- AWS Certified Data Engineer Associate (DEA-C01) — not started
- dbt Analytics Engineering Certification — not started
- Databricks Certified Generative AI Engineer Associate — not started
- African Economic Intelligence Platform (World Bank/IMF data project) — not started
- Agentic AI layer project — not started

---

## Target Roles
Data Engineer, Analytics Engineer, Data Platform Engineer. Given the real seniority level (8 years, Assistant Manager-track), also consider Senior Data Engineer / Senior Analytics Engineer titles where postings' requirements are met. Avoid generic DevOps Engineer framing unless a specific posting explicitly covers data infrastructure ownership.

## Target Countries & Visa Context
Tier 1: Germany (EU Blue Card), Ireland (Critical Skills Employment Permit), Netherlands (Highly Skilled Migrant).
Tier 2: Sweden, Denmark, Canada (Global Talent Stream), UK (Skilled Worker).
MSc degree independently satisfies most degree requirements, so this is less dependent on experience-based/no-degree provisions than initially assumed.

## Tone & Voice Guidance for Generated Content
- Direct, concrete, evidence-led — lead with quantified achievements ($4M profit impact, $100k+ savings, 70%+ efficiency gains) since these are real and strong.
- No generic filler ("results-driven professional," "passionate about data").
- Mirror each posting's language and tool emphasis, but never at the cost of accuracy — do not borrow language that implies experience with tools not listed in the ACTIVE PROFILE section.
- Confidence comes from specificity and real metrics, not from inflated seniority or borrowed-from-roadmap skills.
$$
where id = 1;
