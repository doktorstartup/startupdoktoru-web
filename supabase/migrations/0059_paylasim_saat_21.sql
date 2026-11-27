-- Saat deneyi (Eser kararı, 2026-11-27): video ve kaydırmalı post 19:00 yerine 21:00 TR'de çıkar.
-- Gerekçe: hesabın geçmişinde 21–24 arası paylaşımlar kendi ortancasının ~1,6–1,7 katı, 18–21 arası ~0,9 katı
-- (scripts/analiz/paylasim-analizi.mjs). İki hafta ölçülür; carousel tarafı scripts/carousel/kuyruga-al.mjs SAAT.
-- 0054 gibi: o an yüklü tanımdaki saat sabiti değiştirilir (0043/0046/0047/0054/0056 yamaları korunur).
-- Zaten kuyruğa alınmış videolar eski saatinde kalır.
do $$
declare
  d text := pg_get_functiondef('public.paylasim_kuyruga_al(uuid)'::regprocedure);
  eski constant text := 'saat constant time := ''19:00''';
begin
  if position('saat constant time := ''21:00''' in d) > 0 then return; end if;
  if position(eski in d) = 0 then raise exception 'paylasim_kuyruga_al içinde 19:00 saat sabiti yok'; end if;
  execute replace(d, eski, 'saat constant time := ''21:00''');
end $$;
