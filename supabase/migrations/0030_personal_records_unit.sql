-- Captures which unit (lb/kg) was active when a PR was recorded, so a
-- squat:deadlift-style ratio reconstructed across PR history can detect
-- (and skip) pairs where the two sides were logged under different unit
-- settings, rather than silently dividing mismatched numbers. Nullable,
-- no backfill: existing rows have no reliable way to know their unit
-- retroactively and stay null (best-effort, same limitation already
-- acknowledged in trainingExport.ts) — only new rows, written by logSet
-- going forward, get a real value.
alter table personal_records
  add column unit text check (unit in ('lb', 'kg'));
