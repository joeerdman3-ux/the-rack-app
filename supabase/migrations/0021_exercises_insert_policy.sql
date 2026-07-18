-- Lets a user create a new exercises row inline from the Log Sets flow (an
-- ad-hoc/custom exercise not already in the library). Previously only a
-- select policy existed on exercises, so an insert would be rejected by
-- RLS outright. Mirrors gyms' "authenticated users can create gyms"
-- pattern: open insert, since exercises has no ownership column to scope
-- it to (it's a shared/global table, same as gyms).
create policy "authenticated users can create exercises"
  on exercises for insert
  to authenticated
  with check (true);
