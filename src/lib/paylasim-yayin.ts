import { supabaseAdmin } from "./supabase";
import { notifyAdmin } from "./email";
import { erisimAnahtari } from "./youtube";
import { instagramIstemci, linkedinIstemci, tiktokIstemci, youtubeIstemci } from "./paylasim-platform";
import { kuyrukAdimi, type Depo, type KuyrukVideo, type Platform, type PlatformKaydi } from "./paylasim-kuyruk";

// Kuyruğu gerçek veritabanı ve platformlara bağlar.
// Paylaşım sekmesinden kapalıysa (ds_paylasim_ayar) cron hiçbir şey yayınlamaz (acil durdurma da budur).
export const BUCKET = "paylasim-video";

const hata = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

// Aç/kapa bayrağı. Okunamazsa (migration yok, bağlantı hatası) kapalı sayılır.
export async function paylasimAktif() {
  const { data, error } = await supabaseAdmin.from("ds_paylasim_ayar").select("aktif").maybeSingle();
  return !error && data?.aktif === true;
}

// LinkedIn bağlantısı (ds_paylasim_ayar). Anahtar 60 günlük; dolunca Paylaşım sekmesinden yeniden bağlanır.
export async function linkedinDurumu() {
  const { data } = await supabaseAdmin.from("ds_paylasim_ayar").select("linkedin_token, linkedin_kisi, linkedin_bitis").maybeSingle();
  const kalanGun = data?.linkedin_bitis ? Math.floor((new Date(data.linkedin_bitis).getTime() - Date.now()) / 86400000) : null;
  return { token: data?.linkedin_token as string | null, kisi: data?.linkedin_kisi as string | null, bagli: !!data?.linkedin_token, kalanGun };
}

export async function linkedinHesap() {
  const d = await linkedinDurumu();
  if (!d.token || !d.kisi || (d.kalanGun ?? 0) < 0) {
    throw Object.assign(new Error("LinkedIn bağlı değil ya da yetkinin süresi doldu. Paylaşım sekmesinden bağla, sonra Yeniden dene."), { kalici: true });
  }
  // Etiket listesi okunamazsa gönderi etiketsiz çıkar.
  const { data: etiketler } = await supabaseAdmin.from("ds_linkedin_etiket").select("metinde, ad, urn");
  return { token: d.token, kisi: d.kisi, etiketler: etiketler || [] };
}

// TikTok bağlantısı (ds_paylasim_ayar). Erişim anahtarı kısa ömürlü; yenileme anahtarıyla kendiliğinden yenilenir.
export async function tiktokDurumu() {
  const { data } = await supabaseAdmin.from("ds_paylasim_ayar").select("tiktok_refresh, tiktok_refresh_bitis").maybeSingle();
  const kalanGun = data?.tiktok_refresh_bitis ? Math.floor((new Date(data.tiktok_refresh_bitis).getTime() - Date.now()) / 86400000) : null;
  return { bagli: !!data?.tiktok_refresh, kalanGun };
}

// TikTok'tan anahtar alır (ilk yetki ya da yenileme) ve ayar satırına yazar. Yenileme anahtarı her seferinde değişir.
export async function tiktokAnahtarAl(alan: Record<string, string>) {
  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    // Başlık açık verilmeli: fetch'in eklediği ";charset=UTF-8" TikTok'ta "parameters are malformed" hatası verir.
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY || "", client_secret: process.env.TIKTOK_CLIENT_SECRET || "", ...alan }).toString(),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.access_token || !d?.refresh_token) throw new Error(`TikTok yetki: ${d?.error_description || d?.error || r.status}`);
  const sonra = (sn: number) => new Date(Date.now() + sn * 1000).toISOString();
  const { error } = await supabaseAdmin
    .from("ds_paylasim_ayar")
    .update({ tiktok_access: d.access_token, tiktok_access_bitis: sonra(d.expires_in), tiktok_refresh: d.refresh_token, tiktok_refresh_bitis: sonra(d.refresh_expires_in) })
    .eq("id", true);
  hata(error);
  return d.access_token as string;
}

async function tiktokAnahtari() {
  const { data } = await supabaseAdmin.from("ds_paylasim_ayar").select("tiktok_access, tiktok_access_bitis, tiktok_refresh").maybeSingle();
  if (!data?.tiktok_refresh) {
    throw Object.assign(new Error("TikTok bağlı değil. Paylaşım sekmesinden bağla, sonra Yeniden dene."), { kalici: true });
  }
  // Bitmesine 5 dakikadan fazla varsa mevcut anahtar kullanılır.
  if (data.tiktok_access && new Date(data.tiktok_access_bitis).getTime() > Date.now() + 300000) return data.tiktok_access as string;
  return tiktokAnahtarAl({ grant_type: "refresh_token", refresh_token: data.tiktok_refresh });
}

const depo: Depo = {
  aktif: paylasimAktif,
  async vadesiGelenler() {
    const { data, error } = await supabaseAdmin
      .from("ds_paylasim")
      .select("id, baslik, video_yol, ai_icerik, platformlar, yayin_at, yayin")
      .lte("yayin_at", new Date().toISOString())
      .is("yayin_bitti_at", null)
      .order("yayin_at")
      .limit(3);
    hata(error);
    return (data || []) as KuyrukVideo[];
  },
  async kilitAl(id: string, platform: Platform, sureSn: number) {
    const { data, error } = await supabaseAdmin.rpc("paylasim_kilit_al", { p_id: id, p_platform: platform, p_sure_sn: sureSn });
    hata(error);
    return data as PlatformKaydi | null;
  },
  async yama(id: string, platform: Platform, yama: Partial<PlatformKaydi>, link?: string | null) {
    const { data, error } = await supabaseAdmin.rpc("paylasim_yama", { p_id: id, p_platform: platform, p_yama: yama, p_link: link ?? null });
    hata(error);
    return data as boolean;
  },
  async dosyaTemizle(v: KuyrukVideo) {
    if (!v.video_yol) return;
    await dosyalariSil(v.video_yol);
    hata((await supabaseAdmin.from("ds_paylasim").update({ video_yol: null }).eq("id", v.id)).error);
  },
  async kuyruktanCikar(id: string) {
    hata((await supabaseAdmin.from("ds_paylasim").update({ yayin_at: null, iptal_at: new Date().toISOString(), yayin: {} }).eq("id", id)).error);
  },
};

export async function dosyalariSil(yol: string) {
  hata((await supabaseAdmin.storage.from(BUCKET).remove([yol, yol.replace(/video\.mp4$/, "kapak.jpg")])).error);
}

export function kuyrukCalistir() {
  const adres = (yol: string) => supabaseAdmin.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl;
  return kuyrukAdimi({
    depo,
    youtube: youtubeIstemci(erisimAnahtari, adres),
    instagram: instagramIstemci(process.env.IG_USER_ID || "", process.env.IG_ACCESS_TOKEN || "", adres),
    linkedin: linkedinIstemci(linkedinHesap, adres),
    tiktok: tiktokIstemci(tiktokAnahtari, adres),
    bildir: (konu, metin) => notifyAdmin(konu, `<p>${metin}</p><p>Paylaşım sekmesinden Yeniden dene.</p>`),
    haber: (konu, metin) =>
      notifyAdmin(
        konu,
        `<p>TikTok uygulamasındaki bildirime dokun, aşağıdaki açıklamayı yapıştır ve paylaş.</p><p style="white-space:pre-wrap">${metin.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`,
      ),
  });
}

// Bekçi ve panel için: kalan stok, hata ve geciken yayınlar.
export async function kuyrukOzeti() {
  const { data, error } = await supabaseAdmin
    .from("ds_paylasim")
    .select("baslik, yayin_at, yayin_bitti_at, yayin")
    .not("yayin_at", "is", null)
    .gte("yayin_at", new Date(Date.now() - 7 * 86400000).toISOString());
  if (error) return null; // migration uygulanmadıysa bekçi bozulmasın
  const simdi = Date.now();
  const satirlar = data || [];
  return {
    stok: satirlar.filter((v) => new Date(v.yayin_at).getTime() > simdi).length,
    hatalar: satirlar.filter((v) => Object.values(v.yayin || {}).some((p) => ["hata", "kilitli"].includes((p as PlatformKaydi).durum))).map((v) => v.baslik),
    geciken: satirlar.filter((v) => !v.yayin_bitti_at && new Date(v.yayin_at).getTime() < simdi - 3600000).map((v) => v.baslik),
  };
}
