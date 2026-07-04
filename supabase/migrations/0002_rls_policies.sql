-- Row-Level Security for The Rack. Every table is locked down by default;
-- policies below are the only ways in.

alter table gyms enable row level security;
alter table profiles enable row level security;
alter table workouts enable row level security;
alter table pr_shares enable row level security;
alter table daily_plans enable row level security;
alter table coach_athletes enable row level security;

-- gyms: honor-system directory, readable and creatable by any signed-in user
create policy "gyms are readable by authenticated users"
  on gyms for select
  to authenticated
  using (true);

create policy "authenticated users can create gyms"
  on gyms for insert
  to authenticated
  with check (true);

-- profiles: own row always visible/editable; opted-in rows visible to
-- everyone (leaderboard); linked coaches can see their accepted athletes
create policy "users can view their own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "leaderboard opt-in profiles are public"
  on profiles for select
  to authenticated
  using (leaderboard_opt_in = true);

create policy "coaches can view accepted athletes' profiles"
  on profiles for select
  to authenticated
  using (
    exists (
      select 1 from coach_athletes ca
      where ca.athlete_id = profiles.id
        and ca.coach_id = auth.uid()
        and ca.status = 'accepted'
    )
  );

create policy "users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- workouts: owner has full access; opted-in leaderboard rows and accepted
-- coach relationships extend read access
create policy "users can view their own workouts"
  on workouts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "leaderboard opt-in workouts are public"
  on workouts for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = workouts.user_id
        and p.leaderboard_opt_in = true
    )
  );

create policy "coaches can view accepted athletes' workouts"
  on workouts for select
  to authenticated
  using (
    exists (
      select 1 from coach_athletes ca
      where ca.athlete_id = workouts.user_id
        and ca.coach_id = auth.uid()
        and ca.status = 'accepted'
    )
  );

create policy "users can insert their own workouts"
  on workouts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own workouts"
  on workouts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own workouts"
  on workouts for delete
  to authenticated
  using (auth.uid() = user_id);

-- pr_shares: public feed, owner-only writes
create policy "pr shares are readable by authenticated users"
  on pr_shares for select
  to authenticated
  using (true);

create policy "users can insert their own pr shares"
  on pr_shares for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own pr shares"
  on pr_shares for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own pr shares"
  on pr_shares for delete
  to authenticated
  using (auth.uid() = user_id);

-- daily_plans: strictly private to the owner
create policy "users can view their own daily plans"
  on daily_plans for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own daily plans"
  on daily_plans for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own daily plans"
  on daily_plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own daily plans"
  on daily_plans for delete
  to authenticated
  using (auth.uid() = user_id);

-- coach_athletes: visible to either party; either can propose a link,
-- only the athlete can accept, either can remove the link
create policy "coach or athlete can view the link"
  on coach_athletes for select
  to authenticated
  using (auth.uid() = coach_id or auth.uid() = athlete_id);

create policy "coach or athlete can propose a link"
  on coach_athletes for insert
  to authenticated
  with check (auth.uid() = coach_id or auth.uid() = athlete_id);

create policy "athlete can accept a pending link"
  on coach_athletes for update
  to authenticated
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "coach or athlete can remove the link"
  on coach_athletes for delete
  to authenticated
  using (auth.uid() = coach_id or auth.uid() = athlete_id);
