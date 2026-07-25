-- Trend tracking (v1, ungated for now — Premium's core feature, gating
-- comes later once Stripe is wired up): captures what the sticking-point
-- diagnosis said at the moment each qualifying missed/stalled tagged set
-- was logged, so a history of readings accumulates over time instead of
-- only ever showing today's live snapshot. Append-only — no update/delete
-- policies, same treatment as personal_records.
create table diagnosis_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lift text not null,
  sticking_point text not null check (
    sticking_point in (
      'bench_off_chest', 'bench_midrange', 'bench_lockout',
      'squat_hole', 'squat_parallel', 'squat_above_parallel',
      'deadlift_floor', 'deadlift_below_knee', 'deadlift_knee', 'deadlift_lockout',
      'ohp_bottom', 'ohp_midrange', 'ohp_lockout'
    )
  ),
  -- count / totalTaggedMisses from diagnose()'s "ready" result, as a raw
  -- 0-1 fraction (unrounded) — matches the exact ratio StandardsPanel.tsx
  -- already displays as a rounded percentage.
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_diagnosis_snapshots_user_lift_point
  on diagnosis_snapshots(user_id, lift, sticking_point, snapshot_date);

alter table diagnosis_snapshots enable row level security;

create policy "users can view their own diagnosis snapshots"
  on diagnosis_snapshots for select to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own diagnosis snapshots"
  on diagnosis_snapshots for insert to authenticated
  with check (auth.uid() = user_id);
