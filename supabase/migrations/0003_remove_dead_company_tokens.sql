-- The seeded Greenhouse token for Zalando and Lever token for Delivery Hero
-- were unverified guesses and both 404 against the real APIs - confirmed by
-- direct curl. Remove them rather than let them silently return zero jobs
-- forever. Add real ones via the Settings page after verifying the board
-- actually exists at https://boards.greenhouse.io/<token> or
-- https://jobs.lever.co/<token> first.

delete from companies where ats = 'greenhouse' and token = 'zalando';
delete from companies where ats = 'lever' and token = 'deliveryhero';
