-- INVEST FAZ3 — Girişim profilleri (self-servis) + manuel eşleştirme + yatırımcı portalı.
-- Admin-only pattern: RLS açık, public/anon policy YOK → yalnız service-role erişir.
-- Girişimci/yatırımcı okuma-yazması token-doğrulamalı server API'lerinden (verifyMember) geçer.

-- Girişimci kendi girişim profilini doldurur (asansör konuşması, değer önerisi, sunum, ekip).
-- Bir üye (auth.users) = bir girişim profili (user_id unique). Admin onaylar → eşleştirmeye girer.
create table if not exists inv_startup_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,        -- Supabase auth.users id (FK'siz; kod tabanı e-posta/uuid ile çalışır)
  email text,                          -- admin görünürlüğü için denormalize
  startup_name text not null default '',
  one_liner text,                      -- asansör konuşması (elevator pitch)
  value_prop text,                     -- değer önerisi
  deck_url text,                       -- sunum linki (Drive / DocSend / PDF URL)
  website text,
  sectors text[] not null default '{}',
  stage text,                          -- pre-seed / seed / ...
  team_size int,
  city text,
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'rejected')),
  notes text,                          -- admin iç notu
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inv_startup_profiles_status_idx on inv_startup_profiles (status);
create index if not exists inv_startup_profiles_sectors_idx on inv_startup_profiles using gin (sectors);

-- Manuel eşleştirme: hangi girişim hangi yatırımcıya gösterilecek. Admin elle kurar.
create table if not exists inv_matches (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references inv_investors (id) on delete cascade,
  startup_id uuid not null references inv_startup_profiles (id) on delete cascade,
  note text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (investor_id, startup_id)
);
create index if not exists inv_matches_investor_idx on inv_matches (investor_id);
create index if not exists inv_matches_startup_idx on inv_matches (startup_id);

-- Yatırımcının portala davet durumu (sihirli link ile giriş).
alter table inv_investors add column if not exists portal_enabled boolean not null default false;
alter table inv_investors add column if not exists invited_at timestamptz;

alter table inv_startup_profiles enable row level security;
alter table inv_matches enable row level security;
-- Public policy tanımlanmadı → anon erişemez; service-role (supabaseAdmin) RLS'i bypass eder.
