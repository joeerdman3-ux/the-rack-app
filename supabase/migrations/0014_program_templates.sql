-- Program templates: a read-only, shared library of pre-built programs any
-- user can apply to create their own real program. Global — no owner
-- column, unlike programs/program_weeks/program_sessions/program_exercises.
-- Already created manually in the live project; this migration exists so a
-- fresh project can reproduce the schema, hence "if not exists" throughout.
create table if not exists program_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  source_attribution text,
  created_at timestamptz not null default now()
);

create table if not exists template_weeks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references program_templates(id) on delete cascade,
  week_number integer not null,
  phase_name text,
  note text
);

create table if not exists template_sessions (
  id uuid primary key default gen_random_uuid(),
  template_week_id uuid not null references template_weeks(id) on delete cascade,
  session_number integer not null,
  name text not null
);

create table if not exists template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_session_id uuid not null references template_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  sets integer not null,
  reps integer not null,
  percent_of_max numeric,
  is_amrap boolean not null default false,
  sort_order integer not null default 0
);

create index if not exists idx_template_weeks_template on template_weeks(template_id);
create index if not exists idx_template_sessions_week on template_sessions(template_week_id);
create index if not exists idx_template_exercises_session on template_exercises(template_session_id);

alter table program_templates enable row level security;
alter table template_weeks enable row level security;
alter table template_sessions enable row level security;
alter table template_exercises enable row level security;

-- Global/shared, read-only for all authenticated users — same pattern as
-- exercises / sticking_point_prescriptions. No insert/update/delete
-- policies: templates are managed outside the app, not user-editable.
create policy "program templates are readable by authenticated users"
  on program_templates for select to authenticated
  using (true);
create policy "template weeks are readable by authenticated users"
  on template_weeks for select to authenticated
  using (true);
create policy "template sessions are readable by authenticated users"
  on template_sessions for select to authenticated
  using (true);
create policy "template exercises are readable by authenticated users"
  on template_exercises for select to authenticated
  using (true);
