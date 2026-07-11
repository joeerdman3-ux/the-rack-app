-- Supports the Exercise Library page: 69 general/variation exercises were
-- added alongside the original 29 sticking-point exercises, plus two new
-- columns for browsing/filtering. Already applied manually to the live
-- project; this migration exists so a fresh project can reproduce the
-- schema, hence "if not exists" / defensive drop-then-add throughout.

alter table exercises add column if not exists muscle_group text;
alter table exercises add column if not exists difficulty text;

-- 0006's original constraint only allowed squat/bench/deadlift/ohp; general-
-- purpose accessories need a 'general' value too. Postgres names an inline
-- column check constraint "<table>_<column>_check" by default, which is
-- what 0006 would have produced — drop that exact name defensively (a
-- no-op if it's already been changed) and recreate it with 'general' added.
alter table exercises drop constraint if exists exercises_primary_lift_check;
alter table exercises add constraint exercises_primary_lift_check
  check (primary_lift in ('squat', 'bench', 'deadlift', 'ohp', 'general'));
