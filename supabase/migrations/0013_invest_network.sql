-- INVEST — Yatırımcı İlişki Platformu v1 şeması (FAZ1).
-- Admin-only: RLS açık, public/anon policy YOK → yalnız service-role (supabaseAdmin) erişir.
-- Kaynak zorunluluğu (verified için source_url) uygulama katmanında zorlanır.

create extension if not exists pgcrypto;

-- Yatırımcı (VC/melek) — küratörlü, kaynaklı, insan-onaylı.
create table if not exists inv_investors (
  id uuid primary key default gen_random_uuid(),
  firm_name text not null,
  partner_name text,
  role text,
  email text,
  -- KVKK: yalnız outreach için yayınlanmış adrese yazılır; kişisele yazma.
  address_purpose text not null default 'unknown'
    check (address_purpose in ('outreach_published', 'personal', 'unknown')),
  website text,
  linkedin text,
  twitter text,
  thesis text,
  sectors text[] not null default '{}',
  stages text[] not null default '{}',
  ticket text,
  country text not null default 'TR',
  city text,
  portfolio text,
  source_url text,
  verified_by text,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inv_investors_status_idx on inv_investors (status);
create index if not exists inv_investors_country_idx on inv_investors (country);
create index if not exists inv_investors_sectors_idx on inv_investors using gin (sectors);
create index if not exists inv_investors_stages_idx on inv_investors using gin (stages);

-- 1:1 outreach kaydı + zaman çizelgesi (gönderim akışı FAZ1'in sonraki dilimi).
create table if not exists inv_outreach (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references inv_investors (id) on delete cascade,
  segment text,
  subject text,
  body text,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'sent', 'opened', 'replied', 'bounced', 'opted_out')),
  prepared_at timestamptz not null default now(),
  sent_at timestamptz,
  replied_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists inv_outreach_investor_idx on inv_outreach (investor_id);
create index if not exists inv_outreach_status_idx on inv_outreach (status);

alter table inv_investors enable row level security;
alter table inv_outreach enable row level security;
-- Public policy tanımlanmadı → anon erişemez; supabaseAdmin (service role) RLS'i bypass eder.
