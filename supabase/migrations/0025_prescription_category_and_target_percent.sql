-- Supports two upgrades to the "Prescribed accessory work" cards:
-- 1. category distinguishes an isolation/hypertrophy prescription from the
--    existing compound ones so the UI can label it distinctly, rather than
--    it silently reading as just another item in the list.
-- 2. target_percent (nullable — not every prescription is naturally
--    percent-based, e.g. banded work) lets a prescription carry a % of the
--    user's e1RM for the related main lift, resolved into a recommended
--    weight at render time (dashboard/page.tsx).
--
-- Existing rows default to 'compound' with no target_percent, matching
-- their current (unlabeled, no weight) display exactly — this migration
-- changes no existing row's meaning, only adds capacity for new ones.
--
-- No INSERT/UPDATE RLS policy needed here, same as 0006/0014 — this table
-- stays hand-seeded via direct SQL, never written to by the app.

alter table sticking_point_prescriptions
  add column category text not null default 'compound'
    check (category in ('compound', 'isolation')),
  add column target_percent numeric null;
