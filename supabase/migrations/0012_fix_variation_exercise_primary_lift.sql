-- Data fix: the original ~26 sticking-point-prescription exercises
-- (src/lib/standards/prescriptions.ts) were inserted manually before
-- 'general' existed as a valid exercises.primary_lift value (0006's check
-- constraint only allowed 'squat'/'bench'/'deadlift'/'ohp'; 'general' was
-- added in 0008). None of these are the literal competition lift, so they
-- were mistagged with the nearest of the four original values (e.g. Close-
-- Grip Bench -> 'bench') instead of 'general' — which broke Today's Session
-- "Log this set" routing (Phase 3's primary_lift-based routing sent them to
-- Main Lift mode instead of Accessory mode).
--
-- Plain UPDATE...WHERE, safe to re-run: a name already tagged 'general' is
-- simply not matched by the != condition on a second run.
update exercises
set primary_lift = 'general'
where primary_lift != 'general'
  and name in (
    'Spoto Press',
    'Dead Bench (off pins)',
    'Close-Grip Bench',
    'Board Press (2-board)',
    'Larsen Press',
    'Board Press (4-board)',
    'Banded Bench Press',
    'Pause Squat',
    'Front Squat',
    'Pin Squat (parallel pins)',
    'Tempo Squat (3s down)',
    'Box Squat (high box)',
    'Banded Squat',
    'Deficit Deadlift (1-2")',
    'Snatch-Grip Deadlift',
    'Deficit Deadlift',
    'Romanian Deadlift',
    'Block Pull (below knee)',
    'Block Pull (above knee)',
    'Banded Deadlift',
    'Pin Press (bottom pins)',
    'Push Press',
    'Seated Strict Press',
    'Z-Press',
    'Pin Press (top pins)',
    'Tricep Dips or Skull Crushers'
  );
