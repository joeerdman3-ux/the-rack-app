-- Lets a cloned program (via applyTemplate) preserve a template week's
-- guidance text. `note` was already added manually to the live project;
-- this statement is a no-op there, included so a fresh project can
-- reproduce the schema. `phase_name` is new — this one needs to actually
-- be run.
alter table program_weeks add column if not exists note text;
alter table program_weeks add column if not exists phase_name text;
