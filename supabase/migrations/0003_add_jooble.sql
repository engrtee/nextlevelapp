-- Jooble coverage for countries Adzuna doesn't serve (Ireland, Sweden, Denmark,
-- Spain, Portugal, Finland, Luxembourg). Unlike Adzuna, a Jooble API key is bound
-- to one country domain at signup, so the key lives per-row here rather than as a
-- single global Edge Function secret.
alter table country_config add column if not exists jooble_key text;
