-- Lets a cloned program (via applyTemplate) preserve a template exercise's
-- per-row guidance text, the same way template_weeks.note already carries
-- over to program_weeks.note. Additive only, defaults to null so existing
-- rows/behavior are unaffected.
alter table program_exercises add column if not exists note text;
