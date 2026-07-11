-- Accessory exercise logging, intentionally separate from workouts (main
-- SBD/OHP lifts) so it carries no risk to the leaderboards/standards logic
-- that reads from workouts/best_lifts. Already created manually in the live
-- project; this migration exists so a fresh project can reproduce the
-- schema, hence "if not exists" throughout.
create table if not exists accessory_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  weight numeric not null,
  reps integer not null,
  rpe numeric,
  notes text,
  logged_date date not null,
  logged_at timestamptz default now()
);

create index if not exists idx_accessory_logs_user_date on accessory_logs(user_id, logged_date);

alter table accessory_logs enable row level security;

-- Purely private (own rows only) — unlike workouts, accessory logs aren't
-- read by leaderboards or standards, so no opt-in public-read policy.
create policy "users can view their own accessory logs"
  on accessory_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own accessory logs"
  on accessory_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own accessory logs"
  on accessory_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own accessory logs"
  on accessory_logs for delete
  to authenticated
  using (auth.uid() = user_id);
