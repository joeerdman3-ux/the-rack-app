-- The Rack: core schema
-- Table order matters for FK references (gyms before profiles).

create table gyms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  location text,
  created_at timestamptz default now()
);

-- Extends Supabase's built-in auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  bodyweight numeric,
  unit text default 'lb' check (unit in ('lb', 'kg')),
  gender text check (gender in ('male', 'female')),
  gym_id uuid references gyms(id),
  location text,
  instagram text,
  simple_mode boolean default false,
  leaderboard_opt_in boolean default false,
  created_at timestamptz default now()
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  lift text not null,
  weight numeric not null,
  reps integer not null,
  rpe numeric,
  e1rm numeric not null,
  missed boolean default false,
  logged_date date not null,       -- for daily grouping/history
  logged_at timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_workouts_user_lift on workouts(user_id, lift);
create index idx_workouts_date on workouts(user_id, logged_date);

create table pr_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  workout_id uuid references workouts(id),
  video_url text,
  created_at timestamptz default now()
);

create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan_date date not null,
  exercise_name text not null,
  created_at timestamptz default now(),
  unique(user_id, plan_date, exercise_name)
);

-- Coach-athlete linking. A coach invites an athlete (or vice versa); the
-- athlete must accept before the coach can view their data.
create table coach_athletes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade,
  athlete_id uuid references profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique(coach_id, athlete_id)
);

-- Auto-create a profile row whenever a new auth user signs up, so every
-- authenticated user has a row to attach nickname/settings/workouts to.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
