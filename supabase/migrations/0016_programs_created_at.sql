-- Reproducibility migration: created_at was added directly to the live
-- programs table (see chat) so /programs can order newest-first instead of
-- alphabetically. Run this against a fresh database to match.
alter table programs
  add column if not exists created_at timestamptz not null default now();
