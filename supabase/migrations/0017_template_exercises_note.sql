-- note was already added manually to the live project — same pattern as
-- program_weeks.note (0015): a per-exercise text hint that survives
-- applyTemplate's clone if it's ever carried over, the way template_weeks'
-- note/phase_name already are. This statement is a no-op there, included
-- so a fresh project can reproduce the schema.
alter table template_exercises add column if not exists note text;
