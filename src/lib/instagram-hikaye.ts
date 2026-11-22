import { supabaseAdmin } from "./supabase";
import { notifyAdmin } from "./email";
import { instagramIstemci, linkedinGorselGonderi } from "./paylasim-platform";
import { BUCKET, dosyalariSil, linkedinHesap, paylasimAktif, tiktokAnahtari, tiktokDurumu } from "./paylasim-yayin";

// Instagram hikâyesi (migration 0048):
// 1) Reels yayından HIKAYE_SAAT sonra aynı video hikâye olur. Her tik tek aşama: container aç → hazırsa yayınla.
//    Container tek kullanımlıktır; PUBLISHED dönerse yeniden yayınlanmaz (çift hikâye çıkmaz).
// 2) Hesaptaki aktif hikâyelerin istatistiği ds_ig_hikaye'ye yazılır; 24 saat dolunca Instagram vermez, son okuma kalır.

const GRAPH = "https://graph.facebook.com/v23.0";
export const HIKAYE_SAAT = 48;
const GEC_KALMA_SAAT = 6; // sistem kapalıyken kaçan hikâye sonradan atılmaz
const BEKLEME_DK = 60;
const MAX_DENEME = 5;

type Hikaye = { durum: "isleniyor" | "yayinda" | "hata" | "atlandi"; container?: string | null; container_at?: string | null; id?: string | null; hata?: string | null; deneme?: number };
type Satir = { id: string; baslik: string; video_yol: string | null; yayin: { instagram?: { durum?: string } }; platformlar: { instagram?: { paylasildi_at?: string } }; hikaye: Hikaye | null };

const hesap = () => process.env.IG_USER_ID || "";
const token = () => process.env.IG_ACCESS_TOKEN || "";

async function graf(yol: string) {
  const r = await fetch(`${GRAPH}/${yol}`, { headers: { Authorization: `Bearer ${token()}` } });
  return { ok: r.ok, veri: await r.json().catch(() => null) };
}

async function bitir(s: Satir, h: Hikaye) {
  const { error } = await supabaseAdmin.from("ds_paylasim").update({ hikaye: h, updated_at: new Date().toISOString() }).eq("id", s.id);
  if (error) throw new Error(error.message);
  if (h.durum !== "isleniyor" && s.video_yol) {
    await dosyalariSil(s.video_yol);
    await supabaseAdmin.from("ds_paylasim").update({ video_yol: null }).eq("id", s.id);
  }
  if (h.durum === "hata") await notifyAdmin(`Hikâye hatası: ${s.baslik}`, `<p>Instagram hikâyesi çıkmadı: ${h.hata}</p>`);
  return h.durum;
}

async function hikayeAdimi(s: Satir, simdi: Date): Promise<string> {
  const ig = instagramIstemci(hesap(), token(), (yol) => supabaseAdmin.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl);
  const h: Hikaye = s.hikaye || { durum: "isleniyor" };
  try {
    if (!h.container) {
      const vade = new Date(s.platformlar.instagram!.paylasildi_at!).getTime() + HIKAYE_SAAT * 3600000;
      if (simdi.getTime() - vade > GEC_KALMA_SAAT * 3600000) return bitir(s, { durum: "atlandi", hata: "Saatinde atılamadı (sistem kapalıydı)." });
      // Sözlü hikâye sürümü (teslim.mjs: hikaye.mp4) varsa o, yoksa Reels videosunun kendisi.
      const klasor = s.video_yol!.replace(/\/video\.mp4$/, "");
      const { data: dosyalar } = await supabaseAdmin.storage.from(BUCKET).list(klasor);
      const yol = dosyalar?.some((d) => d.name === "hikaye.mp4") ? `${klasor}/hikaye.mp4` : s.video_yol!;
      const container = await ig.hikayeAc(yol);
      return bitir(s, { ...h, durum: "isleniyor", container, container_at: simdi.toISOString(), hata: null });
    }
    const durum = await ig.durum(h.container);
    if (durum === "IN_PROGRESS") {
      if (simdi.getTime() - new Date(h.container_at!).getTime() > BEKLEME_DK * 60000) throw Object.assign(new Error(`Instagram videoyu ${BEKLEME_DK} dakikada işleyemedi.`), { kalici: true });
      return "isleniyor";
    }
    if (durum === "ERROR" || durum === "EXPIRED") throw Object.assign(new Error(`Hikâye container durumu: ${durum} (video 60 sn'den uzun olabilir).`), { kalici: true });
    // PUBLISHED: önceki tik yayınladı ama kaydedemedi. Yeniden yayınlanmaz.
    const id = durum === "FINISHED" ? await ig.yayinla(h.container) : null;
    return bitir(s, { ...h, durum: "yayinda", id, hata: null });
  } catch (e) {
    const deneme = (h.deneme || 0) + 1;
    const kalici = (e as { kalici?: boolean }).kalici || deneme >= MAX_DENEME;
    return bitir(s, { ...h, deneme, hata: e instanceof Error ? e.message : String(e), durum: kalici ? "hata" : "isleniyor" });
  }
}

// Vadesi gelen Reels hikâyeleri. Paylaşım düğmesi kapalıysa hiçbir şey atılmaz.
export async function reelsHikayeleri(simdi = new Date()) {
  if (!(await paylasimAktif())) return { pasif: true };
  const { data, error } = await supabaseAdmin
    .from("ds_paylasim")
    .select("id, baslik, video_yol, yayin, platformlar, hikaye")
    .not("video_yol", "is", null)
    .or("hikaye.is.null,hikaye->>durum.eq.isleniyor");
  if (error) throw new Error(error.message);
  const sinir = simdi.getTime() - HIKAYE_SAAT * 3600000;
  const vadeli = ((data || []) as Satir[]).filter((s) => {
    const an = s.platformlar?.instagram?.paylasildi_at;
    return s.yayin?.instagram?.durum === "yayinda" && an && new Date(an).getTime() <= sinir;
  });
  const sonuc: Record<string, string> = {};
  for (const s of vadeli.slice(0, 2)) sonuc[s.baslik] = await hikayeAdimi(s, simdi);
  return sonuc;
}

type Soz = { id: string; soz: string; gorsel_yol: string; yayin_at: string; durum: string; container: string | null; container_at: string | null; deneme: number };

// Günlük söz hikâyesi (ds_hikaye_kuyruk, 07:00 TR). Tik başına en fazla bir hikâye, tek aşama.
export async function sozHikayesi(simdi = new Date()) {
  if (!(await paylasimAktif())) return { pasif: true };
  const { data, error } = await supabaseAdmin
    .from("ds_hikaye_kuyruk")
    .select("id, soz, gorsel_yol, yayin_at, durum, container, container_at, deneme")
    .in("durum", ["bekliyor", "isleniyor"])
    .lte("yayin_at", simdi.toISOString())
    .order("yayin_at")
    .limit(1);
  if (error) throw new Error(error.message);
  const s = (data as Soz[] | null)?.[0];
  if (!s) return "yok";

  const yaz = async (alan: Partial<Soz> & { ig_id?: string | null; hata?: string | null }) => {
    const { error: e } = await supabaseAdmin.from("ds_hikaye_kuyruk").update(alan).eq("id", s.id);
    if (e) throw new Error(e.message);
    if (alan.durum === "hata") await notifyAdmin(`Söz hikâyesi çıkmadı`, `<p>${s.soz}</p><p>${alan.hata}</p>`);
    return alan.durum ?? s.durum;
  };
  const ig = instagramIstemci(hesap(), token(), (yol) => supabaseAdmin.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl);
  try {
    if (!s.container) {
      if (simdi.getTime() - new Date(s.yayin_at).getTime() > GEC_KALMA_SAAT * 3600000) return yaz({ durum: "atlandi", hata: "Saatinde atılamadı (sistem kapalıydı)." });
      return yaz({ durum: "isleniyor", container: await ig.hikayeAc(s.gorsel_yol), container_at: simdi.toISOString(), hata: null });
    }
    const durum = await ig.durum(s.container);
    if (durum === "IN_PROGRESS") {
      if (simdi.getTime() - new Date(s.container_at!).getTime() > BEKLEME_DK * 60000) throw Object.assign(new Error("Instagram görseli işleyemedi."), { kalici: true });
      return "isleniyor";
    }
    if (durum === "ERROR" || durum === "EXPIRED") throw Object.assign(new Error(`Hikâye container durumu: ${durum}.`), { kalici: true });
    // PUBLISHED: önceki tik yayınladı ama kaydedemedi; yeniden yayınlanmaz.
    return yaz({ durum: "yayinda", ig_id: durum === "FINISHED" ? await ig.yayinla(s.container) : null, hata: null });
  } catch (e) {
    const deneme = s.deneme + 1;
    const kalici = (e as { kalici?: boolean }).kalici || deneme >= MAX_DENEME;
    return yaz({ deneme, hata: e instanceof Error ? e.message : String(e), ...(kalici ? { durum: "hata" } : {}) });
  }
}

// Söz görselinin LinkedIn gönderisi (linkedin_at, varsayılan 08:30 TR). Önce "gonderiliyor" işaretlenir (satır sahiplenilir):
// cevap kaybolursa ikinci kez gönderilmez, hata bildirilir ve profil elle kontrol edilir.
export async function sozLinkedin(simdi = new Date()) {
  if (!(await paylasimAktif())) return { pasif: true };
  const { data, error } = await supabaseAdmin
    .from("ds_hikaye_kuyruk")
    .select("id, soz, gorsel_yol, linkedin_metin, linkedin_at")
    .not("linkedin_metin", "is", null)
    .is("linkedin_durum", null)
    .neq("durum", "iptal")
    .lte("linkedin_at", simdi.toISOString())
    .order("linkedin_at")
    .limit(1);
  if (error) throw new Error(error.message);
  const s = data?.[0];
  if (!s) return "yok";
  const yaz = async (alan: Record<string, string | null>) => {
    const { error: e } = await supabaseAdmin.from("ds_hikaye_kuyruk").update(alan).eq("id", s.id);
    if (e) throw new Error(e.message);
    return alan.linkedin_durum;
  };
  if (simdi.getTime() - new Date(s.linkedin_at).getTime() > GEC_KALMA_SAAT * 3600000) return yaz({ linkedin_durum: "atlandi", linkedin_hata: "Saatinde atılamadı." });

  const { data: al } = await supabaseAdmin.from("ds_hikaye_kuyruk").update({ linkedin_durum: "gonderiliyor" }).eq("id", s.id).is("linkedin_durum", null).select("id");
  if (!al?.length) return "baska-tik";
  try {
    const link = await linkedinGorselGonderi(await linkedinHesap(), s.linkedin_metin, supabaseAdmin.storage.from(BUCKET).getPublicUrl(s.gorsel_yol).data.publicUrl, s.soz);
    return yaz({ linkedin_durum: "yayinda", linkedin_link: link, linkedin_hata: null });
  } catch (e) {
    const ret = (e as { ret?: boolean }).ret === true;
    const mesaj = e instanceof Error ? e.message : String(e);
    await notifyAdmin(`LinkedIn söz gönderisi ${ret ? "çıkmadı" : "yarıda kaldı"}`, `<p>${s.soz}</p><p>${mesaj}</p>${ret ? "" : "<p>Gönderi çıkmış olabilir: profili kontrol et.</p>"}`);
    return yaz({ linkedin_durum: "hata", linkedin_hata: mesaj });
  }
}

// Söz görselinin TikTok fotoğraf taslağı (migration 0057). Instagram'a çıkmış söz hikâyesi, video.upload izniyle
// hesabın gelen kutusuna düşer; yayını Eser uygulamadan yapar. TikTok görseli yalnız doğrulanmış alan adından
// çektiği için adres sitedir (next.config rewrites /tiktok-medya). Tik başına tek aşama: gönder → sonraki tikte durum.
const TIKTOK_API = "https://open.tiktokapis.com";
const TIKTOK_PENCERE_SAAT = 12;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

async function tiktokCagir(yol: string, govde: object) {
  const r = await fetch(`${TIKTOK_API}${yol}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await tiktokAnahtari()}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(govde),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d || (d.error?.code && d.error.code !== "ok")) throw new Error(`TikTok: ${d?.error?.message || d?.error?.code || r.status}`);
  return d.data;
}

export async function sozTiktok(simdi = new Date()) {
  if (!(await paylasimAktif())) return { pasif: true };
  if (!(await tiktokDurumu()).bagli) return "bagli-degil";
  const { data, error } = await supabaseAdmin
    .from("ds_hikaye_kuyruk")
    .select("id, soz, gorsel_yol, tiktok_durum, tiktok_id")
    .eq("durum", "yayinda")
    .or("tiktok_durum.is.null,tiktok_durum.eq.isleniyor")
    .gte("yayin_at", new Date(simdi.getTime() - TIKTOK_PENCERE_SAAT * 3600000).toISOString())
    .order("yayin_at")
    .limit(1);
  if (error) throw new Error(error.message);
  const s = data?.[0];
  if (!s) return "yok";
  const yaz = async (alan: Record<string, string | null>) => {
    const { error: e } = await supabaseAdmin.from("ds_hikaye_kuyruk").update(alan).eq("id", s.id);
    if (e) throw new Error(e.message);
    return alan.tiktok_durum;
  };

  if (!s.tiktok_durum) {
    // Önce sahiplen: cevap kaybolursa ikinci kez gönderilmez.
    const { data: al } = await supabaseAdmin.from("ds_hikaye_kuyruk").update({ tiktok_durum: "isleniyor" }).eq("id", s.id).is("tiktok_durum", null).select("id");
    if (!al?.length) return "baska-tik";
    try {
      const d = await tiktokCagir("/v2/post/publish/content/init/", {
        post_info: { title: s.soz.slice(0, 90), description: `${s.soz}\n\n#startup #girişimcilik #yatırım` },
        source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [`${SITE}/tiktok-medya/${s.gorsel_yol}`] },
        post_mode: "MEDIA_UPLOAD",
        media_type: "PHOTO",
      });
      return yaz({ tiktok_id: d.publish_id, tiktok_hata: null });
    } catch (e) {
      const mesaj = e instanceof Error ? e.message : String(e);
      await notifyAdmin("TikTok söz taslağı gönderilemedi", `<p>${s.soz}</p><p>${mesaj}</p>`);
      return yaz({ tiktok_durum: "hata", tiktok_hata: mesaj });
    }
  }

  if (!s.tiktok_id) return yaz({ tiktok_durum: "hata", tiktok_hata: "Gönderim kimliği kaydedilmedi; TikTok gelen kutusunu elle kontrol et." });
  const d = await tiktokCagir("/v2/post/publish/status/fetch/", { publish_id: s.tiktok_id });
  if (d.status === "SEND_TO_USER_INBOX" || d.status === "PUBLISH_COMPLETE") {
    await notifyAdmin("TikTok'a söz taslağı düştü", `<p>TikTok uygulamasında gelen kutundan yayınla.</p><p>Açıklama önerisi: ${s.soz}</p>`);
    return yaz({ tiktok_durum: "taslak", tiktok_hata: null });
  }
  if (d.status === "FAILED") {
    const mesaj = `TikTok: ${d.fail_reason || "başarısız"}`;
    await notifyAdmin("TikTok söz taslağı başarısız", `<p>${s.soz}</p><p>${mesaj}</p>`);
    return yaz({ tiktok_durum: "hata", tiktok_hata: mesaj });
  }
  return "isleniyor";
}

const sayi = (v: unknown) => (typeof v === "number" ? v : null);

// Aktif hikâyelerin istatistiğini kaydeder. Az izleyicide Instagram rakam vermez (#10): satır rakamsız kalır.
export async function hikayeIstatistikleri() {
  const { ok, veri } = await graf(`${hesap()}/stories?fields=id,media_type,timestamp,permalink&limit=50`);
  if (!ok) throw new Error(`Instagram hikâye listesi: ${veri?.error?.message || "okunamadı"}`);
  const hikayeler: { id: string; media_type: string; timestamp: string; permalink?: string }[] = veri?.data || [];

  // Bizim attığımız Reels hikâyesi: medya id'si ds_paylasim.hikaye.id'de.
  const { data: bizim } = await supabaseAdmin.from("ds_paylasim").select("id, hikaye").in("hikaye->>id", hikayeler.length ? hikayeler.map((h) => h.id) : ["-"]);
  const kaynak = new Map((bizim || []).map((b) => [b.hikaye?.id as string, b.id as string]));

  for (const h of hikayeler) {
    const m = await graf(`${h.id}/insights?metric=views,reach,replies,shares,total_interactions,follows,profile_visits`);
    const n = await graf(`${h.id}/insights?metric=navigation&breakdown=story_navigation_action_type`);
    const deger = (ad: string) => sayi(m.veri?.data?.find((d: { name: string }) => d.name === ad)?.values?.[0]?.value);
    const gezinme = Object.fromEntries(
      (n.veri?.data?.[0]?.total_value?.breakdowns?.[0]?.results || []).map((r: { dimension_values: string[]; value: number }) => [r.dimension_values[0], r.value]),
    );
    const satir = {
      id: h.id,
      yayin_at: h.timestamp,
      tur: h.media_type,
      link: h.permalink || null,
      ...(kaynak.has(h.id) ? { paylasim_id: kaynak.get(h.id) } : {}),
      son_okuma: new Date().toISOString(),
      ham: m.ok ? null : m.veri?.error || null,
      // Rakam gelmediyse önceki okuma ezilmez.
      ...(m.ok
        ? { goruntuleme: deger("views"), erisim: deger("reach"), yanit: deger("replies"), paylasim: deger("shares"), etkilesim: deger("total_interactions"), takip: deger("follows"), profil_ziyaret: deger("profile_visits") }
        : {}),
      ...(n.ok ? { ileri: gezinme.tap_forward ?? 0, geri: gezinme.tap_back ?? 0, cikis: gezinme.tap_exit ?? 0, sonraki_hesap: gezinme.swipe_forward ?? 0 } : {}),
    };
    const { error } = await supabaseAdmin.from("ds_ig_hikaye").upsert(satir);
    if (error) throw new Error(error.message);
  }
  return hikayeler.length;
}
