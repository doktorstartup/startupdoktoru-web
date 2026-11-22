import { supabaseAdmin } from "./supabase";
import { notifyAdmin } from "./email";
import { instagramIstemci, linkedinBelgeGonderi, linkedinBelgeHazir, linkedinBelgeYukle } from "./paylasim-platform";
import { BUCKET, linkedinHesap, paylasimAktif } from "./paylasim-yayin";

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

type LinkedinSatir = { id: string; baslik: string; pdf_yol: string; linkedin_metin: string; linkedin_belge: string | null; linkedin_durum: string | null; yayin_at: string };

// Aynı slaytların LinkedIn PDF belgesi, aynı saatte. Tik başına tek aşama: yükle → işlendiyse gönder.
// Gönderiden önce "gonderiliyor" işaretlenir (satır sahiplenilir): cevap kaybolursa ikinci kez gönderilmez, hata bildirilir.
export async function carouselLinkedin(simdi = new Date()) {
  if (!(await paylasimAktif())) return { pasif: true };
  const { data, error } = await supabaseAdmin
    .from("ds_carousel_kuyruk")
    .select("id, baslik, pdf_yol, linkedin_metin, linkedin_belge, linkedin_durum, yayin_at")
    .not("linkedin_metin", "is", null)
    .not("pdf_yol", "is", null)
    .or("linkedin_durum.is.null,linkedin_durum.eq.yuklendi")
    .neq("durum", "iptal")
    .lte("yayin_at", simdi.toISOString())
    .order("yayin_at")
    .limit(1);
  if (error) throw new Error(error.message);
  const s = (data as LinkedinSatir[] | null)?.[0];
  if (!s) return "yok";
  const yaz = async (alan: Record<string, string | null>) => {
    const { error: e } = await supabaseAdmin.from("ds_carousel_kuyruk").update(alan).eq("id", s.id);
    if (e) throw new Error(e.message);
    return alan.linkedin_durum ?? s.linkedin_durum;
  };
  const hataVer = async (mesaj: string, belki: boolean) => {
    await notifyAdmin(`LinkedIn kaydırmalı post ${belki ? "yarıda kaldı" : "çıkmadı"}: ${s.baslik}`, `<p>${mesaj}</p>${belki ? "<p>Gönderi çıkmış olabilir: profili kontrol et.</p>" : ""}`);
    return yaz({ linkedin_durum: "hata", linkedin_hata: mesaj });
  };

  try {
    if (!s.linkedin_belge) {
      if (simdi.getTime() - new Date(s.yayin_at).getTime() > GEC_KALMA_SAAT * 3600000) return yaz({ linkedin_durum: "atlandi", linkedin_hata: "Saatinde atılamadı." });
      const belge = await linkedinBelgeYukle(await linkedinHesap(), supabaseAdmin.storage.from(BUCKET).getPublicUrl(s.pdf_yol).data.publicUrl);
      return yaz({ linkedin_belge: belge, linkedin_durum: "yuklendi", linkedin_hata: null });
    }
    const hesap = await linkedinHesap();
    if (!(await linkedinBelgeHazir(hesap, s.linkedin_belge))) {
      if (simdi.getTime() - new Date(s.yayin_at).getTime() > BEKLEME_DK * 60000) return hataVer("LinkedIn belgeyi bir saatte işleyemedi.", false);
      return "isleniyor";
    }
    const { data: al } = await supabaseAdmin.from("ds_carousel_kuyruk").update({ linkedin_durum: "gonderiliyor" }).eq("id", s.id).eq("linkedin_durum", "yuklendi").select("id");
    if (!al?.length) return "baska-tik";
    try {
      const link = await linkedinBelgeGonderi(hesap, s.linkedin_metin, s.linkedin_belge, s.baslik);
      return yaz({ linkedin_durum: "yayinda", linkedin_link: link, linkedin_hata: null });
    } catch (e) {
      return hataVer(e instanceof Error ? e.message : String(e), (e as { ret?: boolean }).ret !== true);
    }
  } catch (e) {
    // Gönderi öncesi hata: yükleme ya da durum sorgusu. Kalıcıysa (bağlı değil, işlenemedi) bildir; değilse sonraki tik dener.
    const mesaj = e instanceof Error ? e.message : String(e);
    if ((e as { kalici?: boolean }).kalici || simdi.getTime() - new Date(s.yayin_at).getTime() > GEC_KALMA_SAAT * 3600000) return hataVer(mesaj, false);
    await yaz({ linkedin_hata: mesaj });
    return "tekrar";
  }
}

// Yayınlanmış kaydırmalı postların Instagram içgörüleri (günlük sosyal cron). Son 30 günün postları güncellenir.
// "follows" (posttan gelen takipçi) her hesapta dönmeyebilir: o zaman onsuz istenir.
export async function carouselIstatistik() {
  const token = process.env.IG_ACCESS_TOKEN || "";
  const { data, error } = await supabaseAdmin
    .from("ds_carousel_kuyruk")
    .select("id, ig_id")
    .eq("durum", "yayinda")
    .not("ig_id", "is", null)
    .gte("yayin_at", new Date(Date.now() - 30 * 86400000).toISOString());
  if (error) throw new Error(error.message);
  const oku = async (id: string, metrik: string) => {
    const r = await fetch(`https://graph.facebook.com/v23.0/${id}/insights?metric=${metrik}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error(`Instagram: ${d?.error?.message || r.status}`);
    return Object.fromEntries((d.data || []).map((x: { name: string; values: { value: number }[] }) => [x.name, x.values?.[0]?.value]));
  };
  let yazilan = 0;
  for (const s of data || []) {
    const temel = "views,reach,saved,shares,total_interactions,likes,comments";
    const g = await oku(s.ig_id, `${temel},follows`).catch(() => oku(s.ig_id, temel));
    const ig_metrikler = { views: g.views, erisim: g.reach, kaydet: g.saved, paylasim: g.shares, etkilesim: g.total_interactions, begeni: g.likes, yorum: g.comments, takip: g.follows };
    const { error: e } = await supabaseAdmin.from("ds_carousel_kuyruk").update({ ig_metrikler, ig_metrik_at: new Date().toISOString() }).eq("id", s.id);
    if (e) throw new Error(e.message);
    yazilan++;
  }
  return { carousel: yazilan };
}
