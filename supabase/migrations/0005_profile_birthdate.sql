-- Needed to select the correct age_bucket when looking up lift_benchmarks.
alter table profiles add column if not exists birthdate date;
