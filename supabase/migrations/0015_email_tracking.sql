-- E-POSTA TAKİBİ — giden mail defteri + gelen cevaplar.
-- Amaç: "hangi mailler gönderildi, kaçı açıldı/tıklandı/bounce oldu" ve yatırımcı cevaplarını kaçırmamak.
-- Resend gönderimde bir message_id döndürür → provider_id olarak saklanır; webhook olayları bununla eşleşir.
-- Admin-only: RLS açık, public/anon policy YOK → yalnız service-role (supabaseAdmin) erişir (inv_* ile aynı desen).

create extension if not exists pgcrypto;

-- Birleşik GİDEN mail defteri: drip, bülten, yatırımcı ve tekil mailler buraya düşer.
create table if not exists ds_email_messages (
  id uuid primary key default gen_random_uuid(),
  provider_id text unique,               -- Resend email id; webhook eşleşme anahtarı (gönderim başarısızsa null)
  context text not null default 'transactional'
    check (context in ('drip', 'broadcast', 'invest', 'transactional', 'test')),
  context_ref text,                      -- enrollment id / investor id / serbest referans
  to_email text not null,
  subject text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  error text,                            -- gönderim hatası veya bounce nedeni
  open_count int not null default 0,
  click_count int not null default 0,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,                 -- ilk açılma
  clicked_at timestamptz,                -- ilk tıklama
  bounced_at timestamptz,
  complained_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ds_email_messages_context_idx on ds_email_messages (context);
create index if not exists ds_email_messages_status_idx on ds_email_messages (status);
create index if not exists ds_email_messages_to_idx on ds_email_messages (to_email);
create index if not exists ds_email_messages_created_idx on ds_email_messages (created_at desc);

-- GELEN cevaplar (Resend Inbound webhook). from_email → yatırımcı eşleşmesiyle bağlanır.
create table if not exists ds_inbound_emails (
  id uuid primary key default gen_random_uuid(),
  provider_id text unique,               -- Resend inbound email id
  from_email text,
  from_name text,
  to_email text,
  subject text,
  preview text,                          -- düz metin ilk ~1000 karakter
  matched_investor_id uuid references inv_investors (id) on delete set null,
  matched_message_id uuid references ds_email_messages (id) on delete set null,
  handled boolean not null default false,
  received_at timestamptz not null default now(),
  raw jsonb,                             -- webhook ham gövdesi (forensik/ileri işleme)
  created_at timestamptz not null default now()
);
create index if not exists ds_inbound_investor_idx on ds_inbound_emails (matched_investor_id);
create index if not exists ds_inbound_handled_idx on ds_inbound_emails (handled);
create index if not exists ds_inbound_received_idx on ds_inbound_emails (received_at desc);

alter table ds_email_messages enable row level security;
alter table ds_inbound_emails enable row level security;
-- Public policy tanımlanmadı → anon erişemez; supabaseAdmin (service role) RLS'i bypass eder.
