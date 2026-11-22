import { youtubeSenkron } from "./youtube";
import { instagramSenkron } from "./instagram";
import { metaReklamSenkron } from "./metaReklam";
import { carouselIstatistik } from "./instagram-carousel";

// Tüm platformları paralel senkronla; biri hata verirse diğeri yine yazılır.
// Reklam harcaması da aynı günlük cron'da çekilir (ayrı Vercel cron'u gerekmesin).
export async function sosyalSenkron() {
  const [youtube, instagram, reklam, carousel] = await Promise.allSettled([youtubeSenkron(), instagramSenkron(), metaReklamSenkron(), carouselIstatistik()]);
  const sonuc = (r: PromiseSettledResult<unknown>) =>
    r.status === "fulfilled" ? r.value : { hata: r.reason instanceof Error ? r.reason.message : String(r.reason) };
  return {
    ok: youtube.status === "fulfilled" && instagram.status === "fulfilled" && reklam.status === "fulfilled",
    youtube: sonuc(youtube),
    instagram: sonuc(instagram),
    reklam: sonuc(reklam),
    carousel: sonuc(carousel), // ok'u etkilemez: deney verisi, yokluğu senkronu hatalı saydırmasın
  };
}
