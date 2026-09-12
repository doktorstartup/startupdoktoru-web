-- INVEST — portföy girişimleri (kişiselleştirilmiş outreach'te sektöre göre eşleşen örnek).
-- Cron/şablon, yatırımcının sektörüyle örtüşen aktif girişimi seçip maile koyar.
-- disclose_name=false → mailde isim yerine `descriptor` kullanılır (isim gizli).
create table if not exists inv_startups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  disclose_name boolean not null default true,
  descriptor text,
  sectors text[] not null default '{}',
  stages text[] not null default '{}',
  one_liner text not null,          -- isim İÇERMEZ; şablon başına adı/descriptor ekler
  ask text,
  deck_url text,
  hero boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table inv_startups enable row level security;
-- Public policy yok → yalnız service-role erişir (cron + admin).

insert into inv_startups (name, disclose_name, descriptor, sectors, stages, one_liner, ask, hero, active) values
('Creato AI', true,
 'a revenue-generating Turkish marketing-AI startup',
 array['ecommerce','marketing','martech','ai','saas','b2b-saas','retail'],
 array['pre-seed','seed'],
 'an autonomous marketing decision engine for e-commerce brands, already revenue-generating (246 connected stores, ₺7M+ of customer revenue recovered in the last 30 days)',
 'opening its first round',
 true, true),
('GRİSTEK', false,
 'a patented Turkish water-tech / deep-tech startup with embedded health-sensing',
 array['cleantech','climatetech','watertech','deeptech','iot','hardware','healthtech','impact','sustainability','energytech'],
 array['seed'],
 'patented IoT greywater-recovery hardware, already deployed at a major Turkish bank and municipalities at 99% measured efficiency, whose embedded sensors open a deeper health-analytics and patent play (Water-as-a-Service model)',
 'raising a $1.5M seed round to scale production',
 false, true)
on conflict (name) do nothing;
