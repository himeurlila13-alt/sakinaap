-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

-- Subscriptions
create table if not exists public.subscriptions (
  user_id uuid references auth.users on delete cascade primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  status text,
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

-- App data (JSON blob per user)
create table if not exists public.user_data (
  user_id uuid references auth.users on delete cascade primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_data enable row level security;

create policy "own_profile_select" on public.profiles for select using (auth.uid() = id);
create policy "own_profile_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own_profile_update" on public.profiles for update using (auth.uid() = id);

create policy "own_subscription_select" on public.subscriptions for select using (auth.uid() = user_id);

create policy "own_data_all" on public.user_data for all using (auth.uid() = user_id);
