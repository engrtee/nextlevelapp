-- Cross-check UK listings against the Home Office's public Register of
-- Licensed Sponsors (Skilled Worker route). null for non-UK listings, or
-- when the register couldn't be fetched that run.
alter table listings add column if not exists licensed_sponsor boolean;
