-- Program Builder (Phase 1: create/view only, no execution/logging wiring).
-- Already created manually in the live project; this migration exists so a
-- fresh project can reproduce the schema, hence "if not exists" throughout.
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null
);

create table if not exists program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  week_number integer not null
);

create table if not exists program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_week_id uuid not null references program_weeks(id) on delete cascade,
  session_number integer not null,
  name text
);

create table if not exists program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_session_id uuid not null references program_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  sets integer not null,
  reps integer not null,
  percent_of_max numeric,
  sort_order integer not null default 0
);

create index if not exists idx_program_weeks_program on program_weeks(program_id);
create index if not exists idx_program_sessions_week on program_sessions(program_week_id);
create index if not exists idx_program_exercises_session on program_exercises(program_session_id);

alter table programs enable row level security;
alter table program_weeks enable row level security;
alter table program_sessions enable row level security;
alter table program_exercises enable row level security;

-- programs: direct ownership.
create policy "users can view their own programs"
  on programs for select to authenticated
  using (auth.uid() = user_id);
create policy "users can insert their own programs"
  on programs for insert to authenticated
  with check (auth.uid() = user_id);
create policy "users can update their own programs"
  on programs for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete their own programs"
  on programs for delete to authenticated
  using (auth.uid() = user_id);

-- program_weeks: ownership via programs.user_id.
create policy "users can view their own program weeks"
  on program_weeks for select to authenticated
  using (exists (
    select 1 from programs p where p.id = program_weeks.program_id and p.user_id = auth.uid()
  ));
create policy "users can insert their own program weeks"
  on program_weeks for insert to authenticated
  with check (exists (
    select 1 from programs p where p.id = program_weeks.program_id and p.user_id = auth.uid()
  ));
create policy "users can update their own program weeks"
  on program_weeks for update to authenticated
  using (exists (
    select 1 from programs p where p.id = program_weeks.program_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from programs p where p.id = program_weeks.program_id and p.user_id = auth.uid()
  ));
create policy "users can delete their own program weeks"
  on program_weeks for delete to authenticated
  using (exists (
    select 1 from programs p where p.id = program_weeks.program_id and p.user_id = auth.uid()
  ));

-- program_sessions: ownership via program_weeks -> programs.user_id.
create policy "users can view their own program sessions"
  on program_sessions for select to authenticated
  using (exists (
    select 1 from program_weeks w
    join programs p on p.id = w.program_id
    where w.id = program_sessions.program_week_id and p.user_id = auth.uid()
  ));
create policy "users can insert their own program sessions"
  on program_sessions for insert to authenticated
  with check (exists (
    select 1 from program_weeks w
    join programs p on p.id = w.program_id
    where w.id = program_sessions.program_week_id and p.user_id = auth.uid()
  ));
create policy "users can update their own program sessions"
  on program_sessions for update to authenticated
  using (exists (
    select 1 from program_weeks w
    join programs p on p.id = w.program_id
    where w.id = program_sessions.program_week_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from program_weeks w
    join programs p on p.id = w.program_id
    where w.id = program_sessions.program_week_id and p.user_id = auth.uid()
  ));
create policy "users can delete their own program sessions"
  on program_sessions for delete to authenticated
  using (exists (
    select 1 from program_weeks w
    join programs p on p.id = w.program_id
    where w.id = program_sessions.program_week_id and p.user_id = auth.uid()
  ));

-- program_exercises: ownership via program_sessions -> program_weeks -> programs.user_id.
create policy "users can view their own program exercises"
  on program_exercises for select to authenticated
  using (exists (
    select 1 from program_sessions s
    join program_weeks w on w.id = s.program_week_id
    join programs p on p.id = w.program_id
    where s.id = program_exercises.program_session_id and p.user_id = auth.uid()
  ));
create policy "users can insert their own program exercises"
  on program_exercises for insert to authenticated
  with check (exists (
    select 1 from program_sessions s
    join program_weeks w on w.id = s.program_week_id
    join programs p on p.id = w.program_id
    where s.id = program_exercises.program_session_id and p.user_id = auth.uid()
  ));
create policy "users can update their own program exercises"
  on program_exercises for update to authenticated
  using (exists (
    select 1 from program_sessions s
    join program_weeks w on w.id = s.program_week_id
    join programs p on p.id = w.program_id
    where s.id = program_exercises.program_session_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from program_sessions s
    join program_weeks w on w.id = s.program_week_id
    join programs p on p.id = w.program_id
    where s.id = program_exercises.program_session_id and p.user_id = auth.uid()
  ));
create policy "users can delete their own program exercises"
  on program_exercises for delete to authenticated
  using (exists (
    select 1 from program_sessions s
    join program_weeks w on w.id = s.program_week_id
    join programs p on p.id = w.program_id
    where s.id = program_exercises.program_session_id and p.user_id = auth.uid()
  ));
