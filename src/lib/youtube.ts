import { supabaseAdmin } from "./supabase";

// YouTube istatistik senkronu — SALT OKUMA (youtube.readonly + yt-analytics.readonly).
// Kanal "Startupdoktoru" Google hesabında; yenileme anahtarı scripts/sosyal/youtube-yetki.mjs ile alınır.
// Env: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN.
// Not: Analytics verisi ~2-3 gün gecikmeli gelir; görüntülenme için Data API sayacı daha güncel.

const DATA = "https://www.googleapis.com/youtube/v3";
const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";

async function erisimAnahtari() {
  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    throw new Error("YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN tanımlı değil.");
  }
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: YOUTUBE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Google token: ${d.error_description || d.error || r.status}`);
  return d.access_token as string;
}

async function getJson(url: string, token: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json();
  if (!r.ok) throw new Error(`YouTube API: ${d.error?.message || r.status}`);
  return d;
}

// PT1M5S → 65
const sureSn = (iso: string) => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0) : null;
};

// youtube.com/shorts/ID, youtu.be/ID, watch?v=ID
export const youtubeId = (link?: string | null) =>
  link?.match(/(?:shorts\/|youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/)?.[1] || null;

type Satir = (string | number)[];

export async function youtubeSenkron() {
  const token = await erisimAnahtari();

  // 1) Kanalın tüm yüklemeleri
  const kanal = await getJson(`${DATA}/channels?part=contentDetails&mine=true`, token);
  const uploads = kanal.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("Kanal bulunamadı — yetki doğru Google hesabıyla mı verildi?");

  const idler: string[] = [];
  let sayfa = "";
  do {
    const d = await getJson(
      `${DATA}/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}${sayfa ? `&pageToken=${sayfa}` : ""}`,
      token
    );
    for (const it of d.items || []) idler.push(it.contentDetails.videoId);
    sayfa = d.nextPageToken || "";
  } while (sayfa);

  const bugun = new Date().toISOString().slice(0, 10);
  const kayitlar: Record<string, Record<string, unknown>> = {};

  for (let i = 0; i < idler.length; i += 50) {
    const parca = idler.slice(i, i + 50);

    // 2) Başlık, tarih, süre, anlık sayaçlar (Data API)
    const v = await getJson(`${DATA}/videos?part=snippet,contentDetails,statistics&id=${parca.join(",")}`, token);
    for (const it of v.items || []) {
      kayitlar[it.id] = {
        baslik: it.snippet.title,
        yayin_at: it.snippet.publishedAt,
        sure_sn: sureSn(it.contentDetails.duration),
        metrikler: {
          views: +it.statistics.viewCount || 0,
          begeni: +it.statistics.likeCount || 0,
          yorum: +it.statistics.commentCount || 0,
        },
      };
    }

    // 3) İzlenme süresi, ortalama izlenme, paylaşım, abone (Analytics API)
    const a = await getJson(
      `${ANALYTICS}?ids=channel==MINE&startDate=2005-01-01&endDate=${bugun}&dimensions=video` +
        `&metrics=estimatedMinutesWatched,averageViewDuration,averageViewPercentage,shares,subscribersGained` +
        `&filters=video==${parca.join(",")}&maxResults=50&sort=-estimatedMinutesWatched`,
      token
    );
    for (const [id, dakika, ortSure, ortYuzde, paylasim, abone] of (a.rows || []) as Satir[]) {
      const k = kayitlar[id as string];
      if (k) Object.assign(k.metrikler as object, { dakika, ort_sure_sn: ortSure, ort_yuzde: ortYuzde, paylasim, abone });
    }
  }

  // 4) Saniye saniye izleyici tutma eğrisi (video başına bir istek, 5'erli paralel).
  // startDate = yayın günü: 2005'ten başlatınca Google istek başına 10-35 sn bekletiyor.
  const tumu = Object.keys(kayitlar);
  for (let i = 0; i < tumu.length; i += 5) {
    await Promise.all(
      tumu.slice(i, i + 5).map(async (id) => {
        const bas = String(kayitlar[id].yayin_at || "2005-01-01").slice(0, 10);
        const t = await getJson(
          `${ANALYTICS}?ids=channel==MINE&startDate=${bas}&endDate=${bugun}` +
            `&dimensions=elapsedVideoTimeRatio&metrics=audienceWatchRatio&filters=video==${id}`,
          token
        );
        kayitlar[id].tutma = t.rows?.length ? t.rows : null;
      })
    );
  }

  // 5) Paylaşım kayıtlarıyla eşle (Shorts linkindeki video kimliği)
  const { data: paylasimlar } = await supabaseAdmin.from("ds_paylasim").select("id, platformlar");
  const eslesme = new Map<string, string>();
  for (const p of paylasimlar || []) {
    const id = youtubeId(p.platformlar?.shorts?.link);
    if (id) eslesme.set(id, p.id);
  }

  const simdi = new Date().toISOString();
  const satirlar = Object.entries(kayitlar).map(([video_id, k]) => ({
    platform: "youtube",
    video_id,
    paylasim_id: eslesme.get(video_id) || null,
    ...k,
    guncellendi_at: simdi,
  }));
  if (satirlar.length) {
    const { error } = await supabaseAdmin.from("ds_sosyal_video").upsert(satirlar, { onConflict: "platform,video_id" });
    if (error) throw new Error(error.message);
  }

  return { video: satirlar.length, eslesen: satirlar.filter((s) => s.paylasim_id).length };
}
