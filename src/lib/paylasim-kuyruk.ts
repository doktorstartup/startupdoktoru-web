// Otomatik paylaşım kuyruğunun tik mantığı. Dış dünya (veritabanı, platformlar) dışarıdan verilir;
// gerçek bağlantılar paylasim-yayin.ts'te. Vercel süresine sığsın diye her tik platform başına tek aşama ilerletir.
//
// Çift paylaşım kuralları:
// - Platforma aynı anda tek tik girer (paylasim_kilit_al). Kilit süresi fonksiyon süresinden uzun.
// - YouTube oturum adresi bayt göndermeden ÖNCE yazılır. Tekrar denemede yeni oturum açılmaz, aynısı sorgulanır:
//   bir oturumdan en fazla bir video çıkar.
// - Instagram container'ı tek kullanımlıktır; önce durumu sorulur, PUBLISHED ise yeniden yayınlanmaz.

export type Platform = "shorts" | "instagram";
export type YayinDurumu = "bekliyor" | "isleniyor" | "yayinda" | "hata" | "kilitli" | "atlandi";

export type PlatformKaydi = {
  durum: YayinDurumu;
  id?: string | null;
  link?: string | null;
  hata?: string | null;
  deneme?: number;
  kilit?: string | null;
  oturum?: string | null; // YouTube devam ettirilebilir yükleme adresi
  container?: string | null; // Instagram medya container'ı
  container_at?: string | null;
};

export type KuyrukVideo = {
  id: string;
  baslik: string;
  video_yol: string | null;
  ai_icerik: boolean;
  yayin_at: string;
  yayin: Partial<Record<Platform, PlatformKaydi>>;
  platformlar: Partial<Record<Platform | "linkedin", { metin?: string; paylasildi_at?: string | null }>>;
};

export type Depo = {
  vadesiGelenler(): Promise<KuyrukVideo[]>;
  kilitAl(id: string, platform: Platform, sureSn: number): Promise<PlatformKaydi | null>;
  yama(id: string, platform: Platform, yama: Partial<PlatformKaydi>, link?: string | null): Promise<boolean>;
  dosyaTemizle(video: KuyrukVideo): Promise<void>;
  kuyruktanCikar(id: string): Promise<void>;
};

export type YouTubeIstemci = {
  oturumAc(video: KuyrukVideo): Promise<string>;
  // Biten yüklemenin video id'si; süre dolduysa null (sonraki tik kaldığı yerden sürer).
  gonder(oturum: string, video: KuyrukVideo): Promise<string | null>;
  kontrol(id: string): Promise<{ gizlilik: string; yukleme: string } | null>;
};

export type InstagramIstemci = {
  containerAc(video: KuyrukVideo): Promise<string>;
  durum(container: string): Promise<string>;
  yayinla(container: string): Promise<string>;
  sonMedya(sonra: string): Promise<string | null>;
  permalink(id: string): Promise<string | null>;
};

export type Bagimliliklar = {
  depo: Depo;
  youtube: YouTubeIstemci;
  instagram: InstagramIstemci;
  bildir(konu: string, metin: string): Promise<unknown>;
  simdi?: () => Date;
};

export const KILIT_SN = 180;
export const MAX_DENEME = 5;
export const IG_BEKLEME_DK = 60;
export const GEC_KALMA_SAAT = 6;

// kalici: yeniden denemesi anlamsız (ilk denemede "hata"ya düşer). yama: hatayla birlikte yazılacak durum.
type AdimHatasi = Error & { kalici?: boolean; yama?: Partial<PlatformKaydi> };
export const adimHatasi = (mesaj: string, ek: { kalici?: boolean; yama?: Partial<PlatformKaydi> }): AdimHatasi => Object.assign(new Error(mesaj), ek);

type Sonuc = { yama: Partial<PlatformKaydi>; link?: string | null };
type Kaydet = (y: Partial<PlatformKaydi>) => Promise<unknown>;

async function youtubeAdimi(d: Bagimliliklar, v: KuyrukVideo, s: PlatformKaydi, kaydet: Kaydet): Promise<Sonuc> {
  // Yükleme bitti: public kaldığını doğrula. Private kalma/ret burada yakalanır.
  if (s.id) {
    const k = await d.youtube.kontrol(s.id);
    if (!k) throw adimHatasi(`YouTube videosu bulunamadı (${s.id}).`, { kalici: true });
    if (k.yukleme === "failed" || k.yukleme === "rejected") throw adimHatasi(`YouTube videoyu reddetti: ${k.yukleme}.`, { kalici: true });
    if (k.gizlilik !== "public") {
      return { yama: { durum: "kilitli", hata: `YouTube videoyu '${k.gizlilik}' bıraktı. Studio'dan kontrol et, kod yeniden yüklemez.` } };
    }
    const link = `https://youtube.com/shorts/${s.id}`;
    return { yama: { durum: "yayinda", link, hata: null }, link };
  }

  let oturum = s.oturum;
  if (!oturum) {
    oturum = await d.youtube.oturumAc(v);
    await kaydet({ durum: "isleniyor", oturum });
  }
  const id = await d.youtube.gonder(oturum, v);
  return { yama: id ? { durum: "isleniyor", id, oturum: null, hata: null } : { durum: "isleniyor" } };
}

async function instagramAdimi(d: Bagimliliklar, v: KuyrukVideo, s: PlatformKaydi, simdi: Date): Promise<Sonuc> {
  if (!s.container) {
    const container = await d.instagram.containerAc(v);
    return { yama: { durum: "isleniyor", container, container_at: simdi.toISOString(), hata: null } };
  }

  const durum = await d.instagram.durum(s.container);
  if (durum === "IN_PROGRESS") {
    const dk = (simdi.getTime() - new Date(s.container_at || simdi).getTime()) / 60000;
    if (dk > IG_BEKLEME_DK) throw adimHatasi(`Instagram videoyu ${IG_BEKLEME_DK} dakikada işleyemedi.`, { kalici: true, yama: { container: null } });
    return { yama: { durum: "isleniyor" } };
  }
  if (durum === "ERROR" || durum === "EXPIRED") {
    // Yayınlanmamış container düştü; sonraki tik yenisini açar.
    throw adimHatasi(`Instagram container durumu: ${durum}.`, { yama: { container: null, container_at: null } });
  }
  if (durum !== "FINISHED" && durum !== "PUBLISHED") throw new Error(`Instagram container durumu: ${durum}.`);

  // PUBLISHED: önceki tik yayınladı ama kaydedemedi; yeniden yayınlanmaz, yalnız id bulunur.
  const id = durum === "FINISHED" ? await d.instagram.yayinla(s.container) : await d.instagram.sonMedya(s.container_at || simdi.toISOString());
  const link = id ? await d.instagram.permalink(id).catch(() => null) : null;
  return { yama: { durum: "yayinda", id, link, hata: null }, link };
}

async function platformAdimi(d: Bagimliliklar, v: KuyrukVideo, p: Platform, simdi: Date) {
  const s = await d.depo.kilitAl(v.id, p, KILIT_SN);
  if (!s) return "kilit-dolu";

  const bitir = async (yama: Partial<PlatformKaydi>, link?: string | null) => {
    const temiz = await d.depo.yama(v.id, p, { ...yama, kilit: null }, link);
    if (temiz) await d.depo.dosyaTemizle(v).catch((e) => console.error("[paylasim] dosya silinemedi:", e));
    if (yama.durum === "hata" || yama.durum === "kilitli") {
      await d.bildir(`Paylaşım hatası: ${v.baslik}`, `${p === "shorts" ? "YouTube Shorts" : "Instagram"}: ${yama.hata}`);
    }
    return yama.durum ?? s.durum;
  };

  try {
    const baslamadi = !s.oturum && !s.container && !s.id;
    if (baslamadi && v.platformlar?.[p]?.paylasildi_at) return await bitir({ durum: "atlandi" });
    if (baslamadi && !v.platformlar?.[p]?.metin?.trim()) throw adimHatasi("Platform metni boş.", { kalici: true });
    if (baslamadi && !v.video_yol) throw adimHatasi("Video dosyası yok.", { kalici: true });

    const sonuc =
      p === "shorts"
        ? await youtubeAdimi(d, v, s, (y) => d.depo.yama(v.id, p, y))
        : await instagramAdimi(d, v, s, simdi);
    return await bitir(sonuc.yama, sonuc.link);
  } catch (e) {
    const h = e as AdimHatasi;
    const deneme = (s.deneme || 0) + 1;
    const kalici = h.kalici || deneme >= MAX_DENEME;
    return await bitir({ ...h.yama, deneme, hata: h.message ?? String(e), ...(kalici ? { durum: "hata" as const } : {}) });
  }
}

// Vadesi gelen her video için iki platformu bağımsız ilerletir; biri düşerse diğeri sürer.
export async function kuyrukAdimi(d: Bagimliliklar) {
  const simdi = d.simdi?.() ?? new Date();
  const videolar = await d.depo.vadesiGelenler();
  const sonuc: Record<string, Record<Platform, string>> = {};
  for (const v of videolar) {
    // Sistem kapalıyken biriken videolar açılınca art arda gitmesin: hiç başlamamış geç video kuyruktan çıkar.
    const baslamadi = Object.values(v.yayin).every((p) => p.durum === "bekliyor" || p.durum === "atlandi");
    if (baslamadi && simdi.getTime() - new Date(v.yayin_at).getTime() > GEC_KALMA_SAAT * 3600000) {
      await d.depo.kuyruktanCikar(v.id);
      await d.bildir(`Paylaşım gecikti: ${v.baslik}`, `Planlanan saatten ${GEC_KALMA_SAAT} saat geçti, yayınlanmadı. Paylaşım sekmesinden kuyruğa al.`);
      continue;
    }
    const [shorts, instagram] = await Promise.allSettled([
      platformAdimi(d, v, "shorts", simdi),
      platformAdimi(d, v, "instagram", simdi),
    ]);
    const yaz = (r: PromiseSettledResult<string>) => (r.status === "fulfilled" ? r.value : `hata: ${r.reason}`);
    sonuc[v.id] = { shorts: yaz(shorts), instagram: yaz(instagram) };
  }
  return { videolar: videolar.length, sonuc };
}

