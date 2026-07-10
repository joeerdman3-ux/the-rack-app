-- Recreates best_lifts with security_invoker so it runs under the querying
-- user's own RLS-checked permissions rather than the view owner's. Without
-- this, a view runs as its owner by default and can silently bypass RLS on
-- the underlying workouts table — meaning a leaderboard query could leak
-- best-lift data for users who never opted in.
--
-- With security_invoker = true, combined with the existing "leaderboard
-- opt-in workouts are public" policy on workouts (0002_rls_policies.sql),
-- a query against this view returns only: the querying user's own rows,
-- plus other users' rows where they're leaderboard opted-in. Exactly what
-- the leaderboard feature needs and nothing more.
--
-- NOTE: this SELECT is inferred from the description "best non-missed
-- e1rm per user per lift" — if your actual best_lifts view has additional
-- filters or differs from this, adjust the SELECT below to match before
-- running, since CREATE OR REPLACE VIEW will overwrite the existing one.
create or replace view best_lifts
with (security_invoker = true)
as
select
  user_id,
  lift,
  max(e1rm) as best_e1rm
from workouts
where missed = false
group by user_id, lift;
