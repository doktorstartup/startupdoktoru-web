// YouTube, Instagram ve LinkedIn yayın istemcileri. Kuyruk kuralları paylasim-kuyruk.ts'te, burada yalnız API çağrıları var.
import type { InstagramIstemci, KuyrukVideo, LinkedInIstemci, YouTubeIstemci } from "./paylasim-kuyruk";

const UPLOAD = "https://www.googleapis.com/upload/youtube/v3/videos";
const DATA = "https://www.googleapis.com/youtube/v3";
const GRAPH = "https://graph.facebook.com/v23.0";
const LINKEDIN = "https://api.linkedin.com/rest";
const LINKEDIN_SURUM = "202610"; // Linkedin-Version; sürümler yaklaşık bir yıl sonra kapanır
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
export const linkedinMetni = (metin: string) => metin.replace(/[\\|{}@[\]()<>*_~]/g, "\\$&").replace(/#(?![\p{L}\p{N}])/gu, "\\#");

// Yetki dönüş adresi; LinkedIn uygulamasında birebir kayıtlı olmalı.
export const LINKEDIN_DONUS = `${process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com"}/api/admin/paylasim/linkedin/geri`;

export type LinkedInHesap = { token: string; kisi: string };

export function linkedinIstemci(hesap: () => Promise<LinkedInHesap>, adres: Adres, api = LINKEDIN): LinkedInIstemci {
  const basliklar = (token: string) => ({
    Authorization: `Bearer ${token}`,
    "Linkedin-Version": LINKEDIN_SURUM,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  });
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
      const { token, kisi } = await hesap();
      const r = await fetch(`${api}/posts`, {
        method: "POST",
        headers: basliklar(token),
        body: JSON.stringify({
          author: `urn:li:person:${kisi}`,
          commentary: linkedinMetni(v.platformlar.linkedin?.metin || ""),
          visibility: "PUBLIC",
          distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
          content: { media: { title: v.baslik, id: videoUrn } },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        }),
      });
      const id = r.headers.get("x-restli-id");
      // Ret cevabı geldi: gönderi kesin çıkmadı, yeniden denenebilir.
      if (!r.ok) throw Object.assign(new Error(`LinkedIn gönderi: ${await hataMetni(r)}`), { yama: { gonderiliyor: false } });
      if (!id) throw new Error("LinkedIn gönderi kimliği dönmedi.");
      return id;
    },
  };
}

// Platform hata mesajı (anahtar içermez). LinkedIn mesajı kökte döner.
async function hataMetni(r: Response) {
  const d = await r.json().catch(() => null);
  return d?.error?.message || d?.message || r.status;
}
