-- Replaces the hardcoded PRESCRIPTIONS lookup (src/lib/standards/prescriptions.ts,
-- now dead code) with real tables so accessory-work recommendations can be
-- edited without a code deploy. Already created manually in the live project
-- as of 2026-07-09; this migration exists so a fresh project can reproduce
-- the schema, hence "if not exists" throughout.
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_lift text not null check (primary_lift in ('squat', 'bench', 'deadlift', 'ohp')),
  movement_pattern text,
  equipment text,
  description text
);

create table if not exists sticking_point_prescriptions (
  id uuid primary key default gen_random_uuid(),
  sticking_point text not null check (
    sticking_point in (
      'bench_off_chest', 'bench_midrange', 'bench_lockout',
      'squat_hole', 'squat_parallel', 'squat_above_parallel',
      'deadlift_floor', 'deadlift_below_knee', 'deadlift_knee', 'deadlift_lockout',
      'ohp_bottom', 'ohp_midrange', 'ohp_lockout'
    )
  ),
  exercise_id uuid not null references exercises(id) on delete cascade,
  rationale text not null,
  sets_reps text not null,
  sort_order integer not null default 0
);

create index if not exists idx_sticking_point_prescriptions_point
  on sticking_point_prescriptions (sticking_point, sort_order);

alter table exercises enable row level security;
alter table sticking_point_prescriptions enable row level security;

create policy "exercises are readable by authenticated users"
  on exercises for select
  to authenticated
  using (true);

create policy "sticking point prescriptions are readable by authenticated users"
  on sticking_point_prescriptions for select
  to authenticated
  using (true);
