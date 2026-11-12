import { supabaseAdmin } from "./supabase";

// Meta reklam harcaması senkronu — SALT OKUMA (ads_read). Reklam düzeyinde, gün gün.
// Env: META_AD_ACCOUNT_ID (act_… ya da yalnız rakam), META_ADS_TOKEN (yoksa IG_ACCESS_TOKEN —
// aynı system user'a reklam hesabı varlığı + ads_read izni verilmiş olmalı).
// Meta son günleri geriye dönük düzelttiği için her çalışmada son GUN günü yeniden yazılır.

const API = "https://graph.facebook.com/v23.0";
const GUN = 7;

type Eylem = { action_type: string; value: string };
type Satir = {
  date_start: string;
  ad_id: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  account_currency?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  frequency?: string;
  inline_link_clicks?: string;
  actions?: Eylem[];
  video_thruplay_watched_actions?: Eylem[];
};

const say = (v?: string) => (v ? Number(v) || 0 : 0);
const eylem = (a: Eylem[] | undefined, ...turler: string[]) =>
  (a || []).filter((x) => turler.includes(x.action_type)).reduce((t, x) => t + say(x.value), 0);

const tarih = (d: Date) => d.toISOString().slice(0, 10);

export async function metaReklamSenkron(gun = GUN) {
  const hesap = process.env.META_AD_ACCOUNT_ID;
  const token = process.env.META_ADS_TOKEN || process.env.IG_ACCESS_TOKEN;
  // Reklam hesabı bağlanmadıysa sessizce atla — diğer senkronları başarısız göstermesin.
  if (!hesap || !token) return { atlandi: "META_AD_ACCOUNT_ID tanımlı değil" };
  const act = hesap.startsWith("act_") ? hesap : `act_${hesap}`;

  const bitis = new Date();
  const baslangic = new Date(Date.now() - (gun - 1) * 864e5);
  const alanlar = [
    "ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name", "account_currency",
    "spend", "impressions", "reach", "frequency", "inline_link_clicks", "actions", "video_thruplay_watched_actions",
  ].join(",");
  const params = new URLSearchParams({
    level: "ad",
    time_increment: "1",
    time_range: JSON.stringify({ since: tarih(baslangic), until: tarih(bitis) }),
    fields: alanlar,
    limit: "500",
    access_token: token,
  });

  const satirlar: Satir[] = [];
  let url = `${API}/${act}/insights?${params}`;
  while (url) {
    const r = await fetch(url);
    const d = await r.json();
    if (!r.ok) throw new Error(`Meta Ads API: ${d.error?.message || r.status}`);
    satirlar.push(...(d.data || []));
    url = d.paging?.next || "";
  }

  const kayitlar = satirlar.map((s) => ({
    tarih: s.date_start,
    ad_id: s.ad_id,
    ad_ad: s.ad_name || null,
    adset_id: s.adset_id || null,
    adset_ad: s.adset_name || null,
    kampanya_id: s.campaign_id || null,
    kampanya_ad: s.campaign_name || null,
    harcama: say(s.spend),
    para_birimi: s.account_currency || null,
    gosterim: say(s.impressions),
    erisim: say(s.reach),
    siklik: s.frequency ? Number(s.frequency) : null,
    link_tiklama: say(s.inline_link_clicks),
    video_3sn: eylem(s.actions, "video_view"),
    thruplay: eylem(s.video_thruplay_watched_actions, "video_view"),
    meta_lead: eylem(s.actions, "lead", "offsite_conversion.fb_pixel_lead"),
    meta_satis: eylem(s.actions, "purchase", "offsite_conversion.fb_pixel_purchase"),
    ham: s,
    guncellendi_at: new Date().toISOString(),
  }));

  for (let i = 0; i < kayitlar.length; i += 500) {
    const { error } = await supabaseAdmin.from("ds_reklam_gunluk").upsert(kayitlar.slice(i, i + 500), { onConflict: "tarih,ad_id" });
    if (error) throw new Error(`ds_reklam_gunluk: ${error.message}`);
  }
  return { satir: kayitlar.length, aralik: `${tarih(baslangic)}…${tarih(bitis)}` };
}
