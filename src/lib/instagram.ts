import { supabaseAdmin } from "./supabase";

// Instagram istatistik senkronu — SALT OKUMA.
// Meta uygulaması "Startup Doktoru İstatistik" (Arvasyon portföyü), Instagram API Unified login:
// System-user anahtarı SÜRESİZ (yenileme yok). Anahtarda publish izni de var ama burada kullanılmaz.
// Env: IG_ACCESS_TOKEN (EAA…), IG_USER_ID (Instagram iş hesabı kimliği, 1784…).
// API'de saniye saniye tutma eğrisi YOK; yalnız ortalama izlenme süresi var.

const API = "https://graph.facebook.com/v23.0";

async function getJson(url: string) {
  const r = await fetch(url);
  const d = await r.json();
  if (!r.ok) throw new Error(`Instagram API: ${d.error?.message || r.status}`);
  return d;
}

// instagram.com/reel/KOD/ , /p/KOD/ , /reels/KOD/
export const instagramKod = (link?: string | null) => link?.match(/instagram\.com\/(?:reels?|p)\/([A-Za-z0-9_-]+)/)?.[1] || null;

type Medya = { id: string; shortcode: string; caption?: string; timestamp: string; like_count?: number; comments_count?: number; media_product_type?: string };

export async function instagramSenkron() {
  const { IG_ACCESS_TOKEN: token, IG_USER_ID: hesap } = process.env;
  if (!token || !hesap) throw new Error("IG_ACCESS_TOKEN / IG_USER_ID tanımlı değil.");

  // 1) Tüm gönderiler; yalnız Reels saklanır
  const videolar: Medya[] = [];
  let url = `${API}/${hesap}/media?fields=id,shortcode,caption,media_product_type,timestamp,like_count,comments_count&limit=50&access_token=${token}`;
  while (url) {
    const d = await getJson(url);
    for (const m of d.data || []) if (m.media_product_type === "REELS") videolar.push(m);
    url = d.paging?.next || "";
  }

  // 2) Video başına içgörüler (15'erli paralel — 5'erli 100+ videoda 60 sn sınırını aşıyordu). Hata veren videoda yalnız sayaçlarla devam.
  const metrik = "views,reach,saved,shares,total_interactions,ig_reels_avg_watch_time";
  const icgoru: Record<string, Record<string, number>> = {};
  for (let i = 0; i < videolar.length; i += 15) {
    await Promise.all(
      videolar.slice(i, i + 15).map(async (m) => {
        try {
          const d = await getJson(`${API}/${m.id}/insights?metric=${metrik}&access_token=${token}`);
          icgoru[m.id] = Object.fromEntries((d.data || []).map((x: { name: string; values: { value: number }[] }) => [x.name, x.values?.[0]?.value]));
        } catch {
          icgoru[m.id] = {};
        }
      })
    );
  }

  // 3) Paylaşım kayıtlarıyla eşle (Instagram linkindeki kısa kod)
  const { data: paylasimlar } = await supabaseAdmin.from("ds_paylasim").select("id, platformlar");
  const eslesme = new Map<string, string>();
  for (const p of paylasimlar || []) {
    const kod = instagramKod(p.platformlar?.instagram?.link);
    if (kod) eslesme.set(kod, p.id);
  }

  const simdi = new Date().toISOString();
  const satirlar = videolar.map((m) => {
    const g = icgoru[m.id] || {};
    return {
      platform: "instagram",
      video_id: m.shortcode,
      paylasim_id: eslesme.get(m.shortcode) || null,
      baslik: (m.caption || "").split("\n")[0].slice(0, 120) || null,
      yayin_at: m.timestamp,
      metrikler: {
        views: g.views,
        erisim: g.reach,
        begeni: m.like_count,
        yorum: m.comments_count,
        paylasim: g.shares,
        kaydet: g.saved,
        etkilesim: g.total_interactions,
        ort_sure_sn: g.ig_reels_avg_watch_time == null ? undefined : Math.round(g.ig_reels_avg_watch_time / 100) / 10,
      },
      guncellendi_at: simdi,
    };
  });
  if (satirlar.length) {
    const { error } = await supabaseAdmin.from("ds_sosyal_video").upsert(satirlar, { onConflict: "platform,video_id" });
    if (error) throw new Error(error.message);
  }

  return { video: satirlar.length, eslesen: satirlar.filter((s) => s.paylasim_id).length };
}
