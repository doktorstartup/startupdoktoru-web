import { supabaseAdmin } from "./supabase";
import { notifyAdmin } from "./email";
import { instagramIstemci } from "./paylasim-platform";
import { BUCKET, paylasimAktif } from "./paylasim-yayin";

// Instagram kaydırmalı post kuyruğu (ds_carousel_kuyruk, migration 0053). Tik başına en fazla bir post, tek aşama:
// container aç → hazırsa yayınla. Container tek kullanımlıktır; PUBLISHED dönerse yeniden yayınlanmaz (çift post çıkmaz).
const GEC_KALMA_SAAT = 6; // sistem kapalıyken kaçan post sonradan atılmaz
const BEKLEME_DK = 60;
const MAX_DENEME = 5;

type Satir = { id: string; baslik: string; metin: string; gorsel_yollar: string[]; yayin_at: string; durum: string; container: string | null; container_at: string | null; deneme: number };

export async function carouselPaylas(simdi = new Date()) {
  if (!(await paylasimAktif())) return { pasif: true };
  const { data, error } = await supabaseAdmin
    .from("ds_carousel_kuyruk")
    .select("id, baslik, metin, gorsel_yollar, yayin_at, durum, container, container_at, deneme")
    .in("durum", ["bekliyor", "isleniyor"])
    .lte("yayin_at", simdi.toISOString())
    .order("yayin_at")
    .limit(1);
  if (error) throw new Error(error.message);
  const s = (data as Satir[] | null)?.[0];
  if (!s) return "yok";

  const yaz = async (alan: Partial<Satir> & { ig_id?: string | null; link?: string | null; hata?: string | null }) => {
    const { error: e } = await supabaseAdmin.from("ds_carousel_kuyruk").update(alan).eq("id", s.id);
    if (e) throw new Error(e.message);
    if (alan.durum === "hata") await notifyAdmin(`Kaydırmalı post çıkmadı: ${s.baslik}`, `<p>${alan.hata}</p>`);
    return alan.durum ?? s.durum;
  };
  const ig = instagramIstemci(process.env.IG_USER_ID || "", process.env.IG_ACCESS_TOKEN || "", (yol) => supabaseAdmin.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl);
  try {
    if (!s.container) {
      if (simdi.getTime() - new Date(s.yayin_at).getTime() > GEC_KALMA_SAAT * 3600000) return yaz({ durum: "atlandi", hata: "Saatinde atılamadı (sistem kapalıydı)." });
      return yaz({ durum: "isleniyor", container: await ig.carouselAc(s.gorsel_yollar, s.metin), container_at: simdi.toISOString(), hata: null });
    }
    const durum = await ig.durum(s.container);
    if (durum === "IN_PROGRESS") {
      if (simdi.getTime() - new Date(s.container_at!).getTime() > BEKLEME_DK * 60000) throw Object.assign(new Error("Instagram görselleri işleyemedi."), { kalici: true });
      return "isleniyor";
    }
    // Yayınlanmamış container düştü: sonraki tik yenisini açar.
    if (durum === "ERROR" || durum === "EXPIRED") throw Object.assign(new Error(`Container durumu: ${durum}.`), { yama: { container: null, container_at: null } });
    if (durum !== "FINISHED" && durum !== "PUBLISHED") throw new Error(`Container durumu: ${durum}.`);
    // PUBLISHED: önceki tik yayınladı ama kaydedemedi; yeniden yayınlanmaz.
    const id = durum === "FINISHED" ? await ig.yayinla(s.container) : null;
    const link = id ? await ig.permalink(id).catch(() => null) : null;
    return yaz({ durum: "yayinda", ig_id: id, link, hata: null });
  } catch (e) {
    const deneme = s.deneme + 1;
    const h = e as { kalici?: boolean; yama?: Partial<Satir> };
    const kalici = h.kalici || deneme >= MAX_DENEME;
    return yaz({ ...h.yama, deneme, hata: e instanceof Error ? e.message : String(e), ...(kalici ? { durum: "hata" } : {}) });
  }
}
