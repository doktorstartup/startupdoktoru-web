import { supabaseAdmin } from "./supabase";
import { notifyAdmin } from "./email";
import { erisimAnahtari } from "./youtube";
import { instagramIstemci, youtubeIstemci } from "./paylasim-platform";
import { kuyrukAdimi, type Depo, type KuyrukVideo, type Platform, type PlatformKaydi } from "./paylasim-kuyruk";

// Kuyruğu gerçek veritabanı ve platformlara bağlar.
// Env: PAYLASIM_AKTIF=1 yoksa cron hiçbir şey yayınlamaz (acil durdurma da budur).
export const BUCKET = "paylasim-video";

const hata = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

const depo: Depo = {
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
    bildir: (konu, metin) => notifyAdmin(konu, `<p>${metin}</p><p>Paylaşım sekmesinden Yeniden dene.</p>`),
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
