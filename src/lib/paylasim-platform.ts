// YouTube, Instagram, LinkedIn ve TikTok yayın istemcileri. Kuyruk kuralları paylasim-kuyruk.ts'te, burada yalnız API çağrıları var.
import type { InstagramIstemci, KuyrukVideo, LinkedInIstemci, TikTokIstemci, YouTubeIstemci } from "./paylasim-kuyruk";

const UPLOAD = "https://www.googleapis.com/upload/youtube/v3/videos";
const DATA = "https://www.googleapis.com/youtube/v3";
const GRAPH = "https://graph.facebook.com/v23.0";
const LINKEDIN = "https://api.linkedin.com/rest";
const LINKEDIN_SURUM = "202610"; // Linkedin-Version; sürümler yaklaşık bir yıl sonra kapanır
const TIKTOK = "https://open.tiktokapis.com";
const GONDERIM_MS = 40_000; // 60 sn fonksiyon sınırı içinde bitsin; kalan sonraki tike kalır

type Adres = (yol: string) => string;
const kapakYolu = (yol: string) => yol.replace(/video\.mp4$/, "kapak.jpg");

// Shorts metni "BAŞLIK: ...\n\nAÇIKLAMA:\n..." kalıbında; kalıp yoksa tüm metin açıklama olur.
export function shortsMetni(metin: string, yedekBaslik: string) {
  const m = metin.match(/BAŞLIK:\s*(.+?)\s*(?:\n+AÇIKLAMA:\s*([\s\S]*))?$/);
  const baslik = (m?.[1] || yedekBaslik).replace(/[<>]/g, "").slice(0, 100).trim();
  return { baslik, aciklama: (m ? m[2] || "" : metin).replace(/[<>]/g, "").trim().slice(0, 5000) };
}

export function youtubeIstemci(anahtar: () => Promise<string>, adres: Adres, api = { upload: UPLOAD, data: DATA }): YouTubeIstemci {
  return {
    async oturumAc(v: KuyrukVideo) {
      const { baslik, aciklama } = shortsMetni(v.platformlar.shorts?.metin || "", v.baslik);
      const r = await fetch(`${api.upload}?uploadType=resumable&part=snippet,status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await anahtar()}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "video/mp4" },
        body: JSON.stringify({
          snippet: { title: baslik, description: aciklama, categoryId: "27", defaultLanguage: "tr" },
          status: { privacyStatus: "public", selfDeclaredMadeForKids: false, containsSyntheticMedia: v.ai_icerik },
        }),
      });
      const oturum = r.headers.get("location");
      if (!r.ok || !oturum) throw new Error(`YouTube oturum: ${await hataMetni(r)}`);
      return oturum;
    },

    async gonder(oturum: string, v: KuyrukVideo) {
      const token = await anahtar();
      const baslik = await fetch(adres(v.video_yol!), { method: "HEAD" });
      const boyut = Number(baslik.headers.get("content-length"));
      if (!baslik.ok || !boyut) throw new Error(`Video dosyasına ulaşılamadı (${baslik.status}).`);

      // Önce oturuma sor: önceki deneme bitmiş olabilir. Yeni bayt göndermeden gerçek durumu öğreniriz.
      const q = await fetch(oturum, { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Range": `bytes */${boyut}` } });
      if (q.ok) return (await q.json()).id as string;
      if (q.status === 404 || q.status === 410) {
        throw Object.assign(new Error("YouTube yükleme oturumu düştü. Video yüklenmiş olabilir: kanalı kontrol et, yoksa Yeniden dene."), {
          kalici: true,
          yama: { oturum: null },
        });
      }
      if (q.status !== 308) throw new Error(`YouTube oturum sorgusu: ${await hataMetni(q)}`);

      const bas = Number(q.headers.get("range")?.split("-")[1] ?? -1) + 1;
      const kaynak = await fetch(adres(v.video_yol!), { headers: { Range: `bytes=${bas}-` } });
      if (!kaynak.ok) throw new Error(`Video dosyası okunamadı (${kaynak.status}).`);
      const parca = await kaynak.arrayBuffer();

      try {
        const r = await fetch(oturum, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "video/mp4", "Content-Range": `bytes ${bas}-${boyut - 1}/${boyut}` },
          body: parca,
          signal: AbortSignal.timeout(GONDERIM_MS),
        });
        if (r.ok) return (await r.json()).id as string;
        if (r.status >= 500 || r.status === 308) return null;
        throw new Error(`YouTube yükleme: ${await hataMetni(r)}`);
      } catch (e) {
        if (e instanceof Error && e.name === "TimeoutError") return null;
        throw e;
      }
    },

    async kontrol(id: string) {
      const r = await fetch(`${api.data}/videos?part=status&id=${id}`, { headers: { Authorization: `Bearer ${await anahtar()}` } });
      if (!r.ok) throw new Error(`YouTube kontrol: ${await hataMetni(r)}`);
      const v = (await r.json()).items?.[0]?.status;
      return v ? { gizlilik: v.privacyStatus as string, yukleme: v.uploadStatus as string } : null;
    },
  };
}

export function instagramIstemci(hesap: string, token: string, adres: Adres, api = GRAPH): InstagramIstemci {
  const al = async (yol: string) => {
    const r = await fetch(`${api}/${yol}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Instagram: ${await hataMetni(r)}`);
    return r.json();
  };
  const gonder = async (yol: string, alan: Record<string, string>) => {
    const r = await fetch(`${api}/${yol}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: new URLSearchParams(alan) });
    if (!r.ok) throw new Error(`Instagram: ${await hataMetni(r)}`);
    return (await r.json()).id as string;
  };

  return {
    containerAc: (v: KuyrukVideo) =>
      gonder(`${hesap}/media`, {
        media_type: "REELS",
        video_url: adres(v.video_yol!),
        cover_url: adres(kapakYolu(v.video_yol!)),
        caption: v.platformlar.instagram?.metin || "",
        share_to_feed: "true",
        ...(v.ai_icerik ? { is_ai_generated: "true" } : {}),
      }),
    // Hikâye açıklama almaz; video en fazla 60 sn olabilir. .jpg yolu görsel hikâye olur.
    hikayeAc: (yol: string) =>
      gonder(`${hesap}/media`, { media_type: "STORIES", ...(/\.jpe?g$/.test(yol) ? { image_url: adres(yol) } : { video_url: adres(yol) }) }),
    // Kaydırmalı post: önce her görsel için çocuk container, sonra onları sırayla taşıyan ana container.
    // Instagram yalnız JPEG kabul eder; 2–10 görsel. Yarıda kalırsa yayınlanmamış container'lar kendiliğinden düşer.
    carouselAc: async (yollar: string[], metin: string) => {
      const cocuklar: string[] = [];
      for (const yol of yollar) cocuklar.push(await gonder(`${hesap}/media`, { image_url: adres(yol), is_carousel_item: "true" }));
      return gonder(`${hesap}/media`, { media_type: "CAROUSEL", children: cocuklar.join(","), caption: metin });
    },
    durum: async (container) => (await al(`${container}?fields=status_code`)).status_code,
    yayinla: (container) => gonder(`${hesap}/media_publish`, { creation_id: container }),
    sonMedya: async (sonra) => {
      const d = await al(`${hesap}/media?fields=id,timestamp&limit=5`);
      const bas = new Date(sonra).getTime();
      return d.data?.find((m: { timestamp: string }) => new Date(m.timestamp).getTime() >= bas)?.id ?? null;
    },
    permalink: async (id) => (await al(`${id}?fields=permalink`)).permalink ?? null,
  };
}

// LinkedIn metin biçiminde ayrılmış karakterler ters eğik çizgiyle yazılır; "#etiket" olduğu gibi kalır.
const kacir = (metin: string) => metin.replace(/[\\|{}@[\]()<>*_~]/g, "\\$&").replace(/#(?![\p{L}\p{N}])/gu, "\\#");

// Şirket etiketi (ds_linkedin_etiket): metinde geçen ilk yer @[ad](urn) olur. Bağlantı ve #etiket içine dokunulmaz.
export type Etiket = { metinde: string; ad: string; urn: string };

export function linkedinMetni(metin: string, etiketler: Etiket[] = []) {
  let s = kacir(metin);
  // Uzun ad önce: "Loom Games" varken "Loom" onun içine girmesin. Yer tutucu, eklenen etiketin yeniden taranmasını önler.
  const sirali = [...etiketler].sort((a, b) => b.metinde.length - a.metinde.length);
  sirali.forEach((e, i) => {
    const ara = kacir(e.metinde).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`(?<![#\\p{L}\\p{N}/.\\-\u0000])${ara}(?![\\p{L}\\p{N}\u0000])`, "u"), `\u0000${i}\u0000`);
  });
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `@[${kacir(sirali[i].ad)}](${sirali[i].urn})`);
}

// Yetki dönüş adresi; LinkedIn uygulamasında birebir kayıtlı olmalı.
export const LINKEDIN_DONUS = `${process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com"}/api/admin/paylasim/linkedin/geri`;

export type LinkedInHesap = { token: string; kisi: string; etiketler?: Etiket[] };

const linkedinBasliklar = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Linkedin-Version": LINKEDIN_SURUM,
  "X-Restli-Protocol-Version": "2.0.0",
  "Content-Type": "application/json",
});

const gonderiGovdesi = (kisi: string, metin: string, icerik: object) =>
  JSON.stringify({
    author: `urn:li:person:${kisi}`,
    commentary: metin,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    content: icerik,
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  });

export type Makale = { metin: string; url: string; baslik: string; aciklama: string; kapakUrl?: string | null };

// Blog yazısını bağlantı kartıyla paylaşır. LinkedIn bağlantıyı kendisi taramaz: başlık, açıklama ve kapak buradan gider.
// Kapak yüklenemezse gönderi kapaksız çıkar. ret: LinkedIn açıkça reddetti (gönderi kesin çıkmadı).
export async function linkedinMakale(hesap: LinkedInHesap, m: Makale, api = LINKEDIN) {
  const kapak = m.kapakUrl ? await linkedinGorsel(hesap, m.kapakUrl, api).catch(() => null) : null;
  const r = await fetch(`${api}/posts`, {
    method: "POST",
    headers: linkedinBasliklar(hesap.token),
    body: gonderiGovdesi(hesap.kisi, linkedinMetni(m.metin, hesap.etiketler), {
      article: { source: m.url, title: m.baslik, description: m.aciklama, ...(kapak ? { thumbnail: kapak } : {}) },
    }),
  });
  const id = r.headers.get("x-restli-id");
  if (!r.ok) throw Object.assign(new Error(`LinkedIn gönderi: ${await hataMetni(r)}`), { ret: true });
  if (!id) throw new Error("LinkedIn gönderi kimliği dönmedi.");
  return `https://www.linkedin.com/feed/update/${id}/`;
}

// Tek görselli gönderi (söz hikâyesi görseli). ret: gönderi kesin çıkmadı (görsel yüklenemedi ya da LinkedIn reddetti).
export async function linkedinGorselGonderi(hesap: LinkedInHesap, metin: string, gorselUrl: string, alt: string, api = LINKEDIN) {
  let gorsel: string;
  try {
    gorsel = await linkedinGorsel(hesap, gorselUrl, api);
  } catch (e) {
    throw Object.assign(e as Error, { ret: true });
  }
  const r = await fetch(`${api}/posts`, {
    method: "POST",
    headers: linkedinBasliklar(hesap.token),
    body: gonderiGovdesi(hesap.kisi, linkedinMetni(metin, hesap.etiketler), { media: { id: gorsel, altText: alt.slice(0, 4000) } }),
  });
  const id = r.headers.get("x-restli-id");
  if (!r.ok) throw Object.assign(new Error(`LinkedIn gönderi: ${await hataMetni(r)}`), { ret: true });
  if (!id) throw new Error("LinkedIn gönderi kimliği dönmedi.");
  return `https://www.linkedin.com/feed/update/${id}/`;
}

async function linkedinGorsel(hesap: LinkedInHesap, url: string, api: string) {
  const dosya = await fetch(url);
  if (!dosya.ok) throw new Error(`Kapak okunamadı (${dosya.status}).`);
  const bas = await fetch(`${api}/images?action=initializeUpload`, {
    method: "POST",
    headers: linkedinBasliklar(hesap.token),
    body: JSON.stringify({ initializeUploadRequest: { owner: `urn:li:person:${hesap.kisi}` } }),
  });
  if (!bas.ok) throw new Error(`LinkedIn görsel: ${await hataMetni(bas)}`);
  const { uploadUrl, image } = (await bas.json()).value as { uploadUrl: string; image: string };
  // Videodan farklı: görsel yüklemesi anahtar ister.
  const r = await fetch(uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${hesap.token}` }, body: await dosya.arrayBuffer() });
  if (!r.ok) throw new Error(`LinkedIn görsel yüklemesi: ${r.status}`);
  return image;
}

export function linkedinIstemci(hesap: () => Promise<LinkedInHesap>, adres: Adres, api = LINKEDIN): LinkedInIstemci {
  const basliklar = linkedinBasliklar;
  const eylem = async (token: string, ad: string, govde: object) => {
    const r = await fetch(`${api}/videos?action=${ad}`, { method: "POST", headers: basliklar(token), body: JSON.stringify(govde) });
    if (!r.ok) throw new Error(`LinkedIn ${ad}: ${await hataMetni(r)}`);
    return r;
  };

  return {
    // Yarıda kalan yükleme gönderiye dönüşmez; sonraki deneme baştan yükler.
    async yukle(v: KuyrukVideo) {
      const { token, kisi } = await hesap();
      const dosya = await fetch(adres(v.video_yol!));
      if (!dosya.ok) throw new Error(`Video dosyası okunamadı (${dosya.status}).`);
      const bayt = await dosya.arrayBuffer();

      const bas = await eylem(token, "initializeUpload", {
        initializeUploadRequest: { owner: `urn:li:person:${kisi}`, fileSizeBytes: bayt.byteLength, uploadCaptions: false, uploadThumbnail: false },
      });
      const { video, uploadToken, uploadInstructions } = (await bas.json()).value as {
        video: string;
        uploadToken: string;
        uploadInstructions: { firstByte: number; lastByte: number; uploadUrl: string }[];
      };
      const sinyal = AbortSignal.timeout(GONDERIM_MS);
      const parcalar = await Promise.all(
        uploadInstructions.map(async (p) => {
          const r = await fetch(p.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: bayt.slice(p.firstByte, p.lastByte + 1),
            signal: sinyal,
          });
          const etag = r.headers.get("etag");
          if (!r.ok || !etag) throw new Error(`LinkedIn parça yüklemesi: ${r.status}`);
          return etag.replace(/"/g, "");
        }),
      );
      await eylem(token, "finalizeUpload", { finalizeUploadRequest: { video, uploadToken, uploadedPartIds: parcalar } });
      return video;
    },

    async hazir(videoUrn: string) {
      const { token } = await hesap();
      const r = await fetch(`${api}/videos/${encodeURIComponent(videoUrn)}`, { headers: basliklar(token) });
      if (!r.ok) throw new Error(`LinkedIn video durumu: ${await hataMetni(r)}`);
      const durum = (await r.json()).status as string;
      if (durum === "PROCESSING_FAILED") {
        throw Object.assign(new Error("LinkedIn videoyu işleyemedi."), { yama: { container: null, container_at: null } });
      }
      return durum === "AVAILABLE";
    },

    async paylas(videoUrn: string, v: KuyrukVideo) {
      const { token, kisi, etiketler } = await hesap();
      const r = await fetch(`${api}/posts`, {
        method: "POST",
        headers: basliklar(token),
        body: gonderiGovdesi(kisi, linkedinMetni(v.platformlar.linkedin?.metin || "", etiketler), { media: { title: v.baslik, id: videoUrn } }),
      });
      const id = r.headers.get("x-restli-id");
      // Ret cevabı geldi: gönderi kesin çıkmadı, yeniden denenebilir.
      if (!r.ok) throw Object.assign(new Error(`LinkedIn gönderi: ${await hataMetni(r)}`), { yama: { gonderiliyor: false } });
      if (!id) throw new Error("LinkedIn gönderi kimliği dönmedi.");
      return id;
    },
  };
}

// Yetki dönüş adresi; TikTok uygulamasında (Login Kit) birebir kayıtlı olmalı.
export const TIKTOK_DONUS = `${process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com"}/api/admin/paylasim/tiktok/geri`;

// TikTok: video hesabın gelen kutusuna taslak olarak yüklenir (video.upload izni); yayını hesap sahibi uygulamadan yapar.
export function tiktokIstemci(anahtar: () => Promise<string>, adres: Adres, api = TIKTOK): TikTokIstemci {
  // TikTok hatayı 200 cevabın içinde de döndürebilir: error.code "ok" değilse hatadır.
  const cagir = async (yol: string, govde: object) => {
    const r = await fetch(`${api}${yol}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await anahtar()}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(govde),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok || !d || (d.error?.code && d.error.code !== "ok")) throw new Error(`TikTok: ${d?.error?.message || d?.error?.code || r.status}`);
    return d.data;
  };

  return {
    // Depo sınırı 50 MB olduğu için dosya tek parçada gider (TikTok tek parçaya 64 MB'a kadar izin verir).
    async taslakGonder(v: KuyrukVideo) {
      const dosya = await fetch(adres(v.video_yol!));
      if (!dosya.ok) throw new Error(`Video dosyası okunamadı (${dosya.status}).`);
      const bayt = await dosya.arrayBuffer();
      const boyut = bayt.byteLength;
      const { publish_id, upload_url } = await cagir("/v2/post/publish/inbox/video/init/", {
        source_info: { source: "FILE_UPLOAD", video_size: boyut, chunk_size: boyut, total_chunk_count: 1 },
      });
      const r = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4", "Content-Range": `bytes 0-${boyut - 1}/${boyut}` },
        body: bayt,
        signal: AbortSignal.timeout(GONDERIM_MS),
      });
      if (r.status !== 201) throw new Error(`TikTok yükleme: ${r.status}`);
      return publish_id as string;
    },

    async durum(publishId: string) {
      const d = await cagir("/v2/post/publish/status/fetch/", { publish_id: publishId });
      return { durum: d.status as string, neden: (d.fail_reason as string) || null };
    },
  };
}

// Platform hata mesajı (anahtar içermez). LinkedIn mesajı kökte döner.
async function hataMetni(r: Response) {
  const d = await r.json().catch(() => null);
  return d?.error?.message || d?.message || r.status;
}
