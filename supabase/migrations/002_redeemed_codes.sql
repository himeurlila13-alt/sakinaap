-- Tracking des activations de codes Premium
-- Empêche qu'un même code soit utilisé par plus de PREMIUM_CODE_MAX_USES utilisatrices
create table if not exists public.redeemed_codes (
  code       text not null,
  user_id    uuid references auth.users on delete cascade not null,
  redeemed_at timestamptz default now(),
  primary key (code, user_id)
);

alter table public.redeemed_codes enable row level security;
-- Pas de policy SELECT/INSERT pour les utilisatrices — accès via service key uniquement
