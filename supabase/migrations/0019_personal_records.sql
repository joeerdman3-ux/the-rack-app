-- PR (personal record) detection: a full history of PR moments per
-- user/lift, not just a single "current max" flag — supports a future PR
-- timeline or recent-PRs leaderboard. Written by logSet (dashboard/
-- actions.ts) whenever a newly logged main-lift set beats the user's prior
-- best e1rm (or is their first-ever logged set for that lift). Only ever
-- written from workouts (main lifts) — accessory_logs is untouched.
create table if not exists personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  lift text not null,
  e1rm numeric not null,
  weight numeric not null,
  reps integer not null,
  workout_id uuid references workouts(id) on delete cascade,
  achieved_at timestamptz not null default now()
);

create index if not exists idx_personal_records_user_lift on personal_records(user_id, lift);

alter table personal_records enable row level security;

-- Purely private (own rows only), same as accessory_logs — not read by
-- leaderboards/standards today.
create policy "users can view their own personal records"
  on personal_records for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own personal records"
  on personal_records for insert
  to authenticated
  with check (auth.uid() = user_id);
