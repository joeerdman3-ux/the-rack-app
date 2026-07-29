-- Main Lift logging parity: notes matches accessory_logs' existing free-
-- text field exactly (nullable, no constraints). video_url is new and
-- scoped to Main Lift only — video review value is tied to competition-
-- lift attempts specifically, where the diagnosis engine's misses/
-- stalls/sticking points already live; accessory_logs gets no equivalent
-- column. No format constraint at the DB level, same as every other
-- free-text/URL-shaped column in this schema (e.g. exercises.description) —
-- "looks like a URL" is checked app-side, not enforced here.
alter table workouts
  add column notes text,
  add column video_url text;
