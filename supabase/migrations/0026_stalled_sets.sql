-- "Stalled" tags a set that was completed (missed = false, so it already
-- counts as a hit everywhere missed-based logic looks — best_lifts, hitSets,
-- bestSessionsByLift, leaderboards) but ground out badly enough to be worth
-- diagnosing, same as a missed rep. Mutually exclusive with missed: a rep
-- can't be both failed and ground out.
alter table workouts
  add column stalled boolean not null default false
    check (not (missed and stalled));
