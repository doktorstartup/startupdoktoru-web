-- ENGELLEME (SUPPRESSION) LİSTESİ — bir daha mail atılmayacak adresler.
-- Kaynak: bounce / şikâyet (webhook otomatik) · abonelikten çıkma (kullanıcı) · elle ekleme (admin).
-- Tüm pazarlama gönderimleri (drip/bülten/yatırımcı) sendLogged içinde buradan geçer.
-- Admin-only: RLS açık, public policy YOK → yalnız service-role erişir.

create extension if not exists pgcrypto;

create table if not exists ds_email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,            -- daima küçük harf (uygulama normalize eder)
  reason text not null default 'manual'
    check (reason in ('bounced', 'complained', 'unsubscribed', 'manual')),
  source text,                           -- hangi bağlamdan geldi (drip/broadcast/invest/webhook)
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists ds_email_suppressions_reason_idx on ds_email_suppressions (reason);
create index if not exists ds_email_suppressions_created_idx on ds_email_suppressions (created_at desc);

alter table ds_email_suppressions enable row level security;

-- Giden defterde "engellendiği için gönderilmedi" durumunu görebilmek için yeni statü.
alter table ds_email_messages drop constraint if exists ds_email_messages_status_check;
alter table ds_email_messages add constraint ds_email_messages_status_check
  check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed', 'suppressed'));
