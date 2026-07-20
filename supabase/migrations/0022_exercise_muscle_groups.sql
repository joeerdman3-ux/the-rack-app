-- Replaces exercises.muscle_group (a single free-text value) with a proper
-- many-to-many model: a compound lift trains multiple muscle groups at
-- different relative contributions (e.g. deadlift is back/hamstrings/glutes,
-- not just one), which a single tag couldn't represent. Hard cutover in one
-- migration — no dual-write/transition period — since the column only had
-- 3 read call sites, 1 write call site, and 4 duplicated type declarations,
-- all updated in the same PR as this migration.
--
-- Wrapped in an explicit transaction: existing non-null muscle_group values
-- are copied into the new table (normalized to lower/trim) before the old
-- column is dropped, so a value that doesn't already match the canonical
-- list below aborts the whole migration instead of silently losing data —
-- better to fail loudly and let it be reconciled by hand (same backfill
-- flow as the already-known 30 null exercises) than lose history.

begin;

create table exercise_muscle_groups (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  -- Adjust in lockstep with MUSCLE_GROUPS in src/lib/lifting/muscleGroups.ts
  -- if this list ever changes — same manual-sync pattern already used for
  -- sticking_point_prescriptions.sticking_point / StickingPoint.
  muscle_group text not null check (
    muscle_group in (
      'chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes',
      'biceps', 'triceps', 'calves', 'core', 'forearms'
    )
  ),
  ratio numeric not null check (ratio > 0 and ratio <= 1),
  unique (exercise_id, muscle_group)
);

create index idx_exercise_muscle_groups_exercise on exercise_muscle_groups(exercise_id);
create index idx_exercise_muscle_groups_muscle_group on exercise_muscle_groups(muscle_group);

alter table exercise_muscle_groups enable row level security;

create policy "exercise muscle groups are readable by authenticated users"
  on exercise_muscle_groups for select
  to authenticated
  using (true);

-- Mirrors the "authenticated users can create exercises" policy from
-- 0021: open insert, since exercise_muscle_groups has no ownership column
-- either (it's a shared/global table describing the exercises library).
create policy "authenticated users can create exercise muscle groups"
  on exercise_muscle_groups for insert
  to authenticated
  with check (true);

-- Every exercise with a known (non-null) muscle_group becomes a single
-- ratio-1.0 row — it was a single value before, so it's a 100% share now.
-- Exercises with muscle_group already null get zero rows, same "not yet
-- classified" meaning as before, deferred to the planned backfill pass.
insert into exercise_muscle_groups (exercise_id, muscle_group, ratio)
select id, lower(trim(muscle_group)), 1.0
from exercises
where muscle_group is not null
  and lower(trim(muscle_group)) in (
    'chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes',
    'biceps', 'triceps', 'calves', 'core', 'forearms'
  );

do $$
declare
  lost_count integer;
begin
  select count(*) into lost_count
  from exercises
  where muscle_group is not null
    and id not in (select exercise_id from exercise_muscle_groups);

  if lost_count > 0 then
    raise exception
      'exercise_muscle_groups migration: % exercise(s) have a non-null muscle_group that did not match the canonical list after lower/trim — resolve manually (check the actual values with select name, muscle_group from exercises where ...) before re-running this migration',
      lost_count;
  end if;
end $$;

alter table exercises drop column muscle_group;

commit;
