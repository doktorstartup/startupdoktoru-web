-- INVEST — tier-1 davet kampanyası + ilgi→profil altyapısı.
-- inv_outreach.status'a 'interested' eklenir (İlgileniyorum tıklaması yakalandığında).
alter table inv_outreach drop constraint if exists inv_outreach_status_check;
alter table inv_outreach add constraint inv_outreach_status_check
  check (status in ('draft', 'approved', 'sent', 'opened', 'replied', 'interested', 'bounced', 'opted_out'));

-- inv_investors: ilgi zaman damgası (otomatik profil / pipeline sıralaması).
alter table inv_investors add column if not exists interest_at timestamptz;
create index if not exists inv_investors_interest_idx on inv_investors (interest_at);

-- Aynı yatırımcı+kampanya için tek outreach satırı (cron dedup güvencesi).
create unique index if not exists inv_outreach_investor_segment_idx
  on inv_outreach (investor_id, segment);
