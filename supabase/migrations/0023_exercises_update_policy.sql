-- Enables the new Exercise Library edit UI: previously exercises and
-- exercise_muscle_groups only had select+insert policies (0021/0022), so
-- any update to an exercise's name or muscle groups would be rejected by
-- RLS outright. Same open permissiveness as the existing insert policies —
-- neither table has an ownership column to scope narrower than "any
-- authenticated user."
--
-- exercise_muscle_groups also gets a delete policy, not just update:
-- editing an exercise's muscle groups is implemented as a full replace of
-- its row set (delete the old rows, insert the new ones) rather than
-- row-by-row updates, since a muscle group can be removed entirely and
-- there's no soft-delete flag to update instead.

create policy "authenticated users can update exercises"
  on exercises for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can update exercise muscle groups"
  on exercise_muscle_groups for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete exercise muscle groups"
  on exercise_muscle_groups for delete
  to authenticated
  using (true);
