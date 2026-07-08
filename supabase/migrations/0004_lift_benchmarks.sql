-- Reference table for real competition-percentile strength standards
-- (Squat/Bench/Deadlift), sourced from OpenPowerlifting (openpowerlifting.org,
-- public domain). Already created manually in the live project as of
-- 2026-07-07; this migration exists so a fresh project can reproduce the
-- schema, hence "if not exists" throughout.
create table if not exists lift_benchmarks (
  "Sex" text not null,
  age_bucket text not null,
  weight_class text not null,
  n integer,
  squat_p10 numeric,
  squat_p25 numeric,
  squat_p50 numeric,
  squat_p75 numeric,
  squat_p90 numeric,
  squat_p95 numeric,
  squat_p99 numeric,
  bench_p10 numeric,
  bench_p25 numeric,
  bench_p50 numeric,
  bench_p75 numeric,
  bench_p90 numeric,
  bench_p95 numeric,
  bench_p99 numeric,
  deadlift_p10 numeric,
  deadlift_p25 numeric,
  deadlift_p50 numeric,
  deadlift_p75 numeric,
  deadlift_p90 numeric,
  deadlift_p95 numeric,
  deadlift_p99 numeric
);

create index if not exists idx_lift_benchmarks_sex_age on lift_benchmarks ("Sex", age_bucket);

alter table lift_benchmarks enable row level security;

create policy "lift benchmarks are readable by authenticated users"
  on lift_benchmarks for select
  to authenticated
  using (true);
