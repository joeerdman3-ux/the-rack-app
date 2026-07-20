-- exercises/exercise_muscle_groups had no ownership column, so the update
-- policies added in 0023 let any authenticated user edit any exercise,
-- including core lifts like Squat/Deadlift. created_by distinguishes
-- preset/seeded exercises (null — every one of the ~98 existing rows gets
-- this by default, no backfill needed) from user-created ones (the
-- creating user's id), and is the single source of truth for both
-- "is this locked" and "who can edit it."
--
-- on delete set null (not cascade): if a user's account is deleted, their
-- custom exercises shouldn't vanish out from under other users' logs/
-- programs/muscle-group data that may already reference them — the
-- exercise just becomes ownerless (behaves like a preset) rather than the
-- row disappearing.

alter table exercises add column created_by uuid references profiles(id) on delete set null;
create index idx_exercises_created_by on exercises(created_by);

drop policy "authenticated users can update exercises" on exercises;
create policy "users can update exercises they created"
  on exercises for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- exercise_muscle_groups has no ownership column of its own — every policy
-- here joins back to the owning exercises row instead.
drop policy "authenticated users can update exercise muscle groups" on exercise_muscle_groups;
create policy "users can update muscle groups for exercises they created"
  on exercise_muscle_groups for update
  to authenticated
  using (
    exists (
      select 1 from exercises e
      where e.id = exercise_muscle_groups.exercise_id
        and e.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from exercises e
      where e.id = exercise_muscle_groups.exercise_id
        and e.created_by = auth.uid()
    )
  );

drop policy "authenticated users can delete exercise muscle groups" on exercise_muscle_groups;
create policy "users can delete muscle groups for exercises they created"
  on exercise_muscle_groups for delete
  to authenticated
  using (
    exists (
      select 1 from exercises e
      where e.id = exercise_muscle_groups.exercise_id
        and e.created_by = auth.uid()
    )
  );

-- Insert was previously open to any exercise_id — nothing in the app UI
-- exploited that (createExercise only ever inserts rows for the exercise
-- it just created), but tightening it closes a gap where a direct API
-- call could attach muscle groups to someone else's or a preset exercise.
drop policy "authenticated users can create exercise muscle groups" on exercise_muscle_groups;
create policy "users can create muscle groups for exercises they created"
  on exercise_muscle_groups for insert
  to authenticated
  with check (
    exists (
      select 1 from exercises e
      where e.id = exercise_muscle_groups.exercise_id
        and e.created_by = auth.uid()
    )
  );
