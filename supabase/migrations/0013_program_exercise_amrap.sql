-- AMRAP support: marks a program_exercises row's reps value as a
-- target/minimum ("5+") rather than a fixed count. Reproducibility
-- migration — additive only, defaults false so existing rows/behavior are
-- unaffected.
alter table program_exercises add column if not exists is_amrap boolean not null default false;
