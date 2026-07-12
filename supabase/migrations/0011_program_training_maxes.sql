-- Program Builder Phase 2: training maxes for percent_of_max resolution.
-- Reproducibility migration, hence "if not exists" for the table.
create table if not exists program_training_maxes (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  training_max_kg numeric not null,
  unique (program_id, exercise_id)
);

create index if not exists idx_program_training_maxes_program on program_training_maxes(program_id);

alter table program_training_maxes enable row level security;

-- program_training_maxes: ownership via programs.user_id (direct program_id FK).
create policy "users can view their own program training maxes"
  on program_training_maxes for select to authenticated
  using (exists (
    select 1 from programs p where p.id = program_training_maxes.program_id and p.user_id = auth.uid()
  ));
create policy "users can insert their own program training maxes"
  on program_training_maxes for insert to authenticated
  with check (exists (
    select 1 from programs p where p.id = program_training_maxes.program_id and p.user_id = auth.uid()
  ));
create policy "users can update their own program training maxes"
  on program_training_maxes for update to authenticated
  using (exists (
    select 1 from programs p where p.id = program_training_maxes.program_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from programs p where p.id = program_training_maxes.program_id and p.user_id = auth.uid()
  ));
create policy "users can delete their own program training maxes"
  on program_training_maxes for delete to authenticated
  using (exists (
    select 1 from programs p where p.id = program_training_maxes.program_id and p.user_id = auth.uid()
  ));
