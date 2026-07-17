-- Lightweight "Premium waitlist" interest tracking — no billing, just
-- capturing who wants to be notified when Premium launches. unique(user_id)
-- means joining twice is a no-op conflict, not a duplicate row.
create table if not exists premium_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table premium_waitlist enable row level security;

-- Purely private (own row only), same as accessory_logs/personal_records.
create policy "users can view their own premium waitlist entry"
  on premium_waitlist for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own premium waitlist entry"
  on premium_waitlist for insert
  to authenticated
  with check (auth.uid() = user_id);
