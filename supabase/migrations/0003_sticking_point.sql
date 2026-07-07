alter table workouts add column sticking_point text check (
  sticking_point is null or sticking_point in (
    'bench_off_chest', 'bench_midrange', 'bench_lockout',
    'squat_hole', 'squat_parallel', 'squat_above_parallel',
    'deadlift_floor', 'deadlift_below_knee', 'deadlift_knee', 'deadlift_lockout',
    'ohp_bottom', 'ohp_midrange', 'ohp_lockout'
  )
);
