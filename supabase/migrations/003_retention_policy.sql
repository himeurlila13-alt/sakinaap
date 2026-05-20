-- Politique de rétention automatique — Art. 5.1.e RGPD
-- Purge les données de santé et de pratique religieuse des comptes inactifs depuis 3 ans.
-- Les entrées auth.users et subscriptions sont conservées pour les obligations comptables.

-- Activer pg_cron (disponible sur tous les projets Supabase)
create extension if not exists pg_cron with schema pg_catalog;

-- Activer pg_net (pour les appels HTTP si besoin futur)
create extension if not exists pg_net with schema extensions;

-- ── Fonction de purge ──────────────────────────────────────────────────────
create or replace function purge_inactive_health_data()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff     timestamptz := now() - interval '3 years';
  nb_deleted integer;
begin
  delete from public.user_data
  where updated_at < cutoff;

  get diagnostics nb_deleted = row_count;

  -- Journaliser pour auditabilité RGPD
  insert into public.rgpd_purge_log (purged_at, rows_deleted, reason)
  values (now(), nb_deleted, 'inactivity_3y');

  return nb_deleted;
end;
$$;

-- ── Table de journal des purges (preuve de conformité CNIL) ───────────────
create table if not exists public.rgpd_purge_log (
  id          bigserial primary key,
  purged_at   timestamptz not null default now(),
  rows_deleted integer     not null default 0,
  reason      text        not null
);

-- Seul le service_role peut lire ce journal
alter table public.rgpd_purge_log enable row level security;
-- (pas de policy SELECT pour les utilisatrices — accès admin uniquement)

-- ── Planification hebdomadaire (dimanche 3h00 UTC) ────────────────────────
select cron.schedule(
  'purge-inactive-health-data',   -- nom du job (unique)
  '0 3 * * 0',                    -- cron : chaque dimanche à 3h UTC
  $$ select purge_inactive_health_data(); $$
);
