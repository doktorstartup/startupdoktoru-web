-- Kaydırmalı post da 19:00'da, videonun yerine çıkar (Eser kararı, 2026-11-22: tür deneyi — aynı saatte Reels mi carousel mi).
-- Video yerleştirici (paylasim_kuyruga_al), kuyrukta kaydırmalı post olan günü dolu sayar ve sonraki boş güne geçer.
-- Ters yönü scripts/carousel/kuyruga-al.mjs yapar (video olan güne carousel koymaz).
--
-- 0047 gibi: gövde sürüme göre değiştiği için yeniden yazılmaz, o an yüklü tanımdaki gün koşuluna ek yapılır.
-- 0043/0046 sonradan yeniden uygulanırsa 0047 ve bu dosya tekrar çalıştırılmalı.
do $$
declare
  d text := pg_get_functiondef('public.paylasim_kuyruga_al(uuid)'::regprocedure);
  eski constant text := 'select 1 from public.ds_paylasim p where (p.yayin_at at time zone ''Europe/Istanbul'')::date = gun';
begin
  if position('ds_carousel_kuyruk' in d) > 0 then return; end if;
  if position(eski in d) = 0 then raise exception 'paylasim_kuyruga_al içinde beklenen gün koşulu yok'; end if;
  execute replace(d, eski, eski || '
    ) and not exists (
      select 1 from public.ds_carousel_kuyruk c where c.durum in (''bekliyor'', ''isleniyor'', ''yayinda'')
        and (c.yayin_at at time zone ''Europe/Istanbul'')::date = gun');
end $$;

-- LinkedIn: aynı slaytlar PDF belge olarak, aynı saatte (yayin_at). linkedin_metin null ise LinkedIn'e gitmez.
-- linkedin_durum: null (başlamadı) → yuklendi (belge LinkedIn'de, işleniyor) → gonderiliyor → yayinda | hata | atlandi
alter table public.ds_carousel_kuyruk
  add column if not exists pdf_yol text,
  add column if not exists linkedin_metin text,
  add column if not exists linkedin_belge text,
  add column if not exists linkedin_durum text,
  add column if not exists linkedin_link text,
  add column if not exists linkedin_hata text,
  -- Instagram içgörüleri (günlük sosyal cron yazar): views, erisim, kaydet, paylasim, etkilesim, begeni, yorum, takip.
  -- Reels'inkiler ds_sosyal_video'da; tür karşılaştırması scripts/carousel/rapor.mjs.
  add column if not exists ig_metrikler jsonb,
  add column if not exists ig_metrik_at timestamptz;
