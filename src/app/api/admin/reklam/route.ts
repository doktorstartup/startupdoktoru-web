import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";
import { metaReklamSenkron } from "../../../../lib/metaReklam";

// Admin: reklam × sonuç tablosu. Harcama Meta'dan (ds_reklam_gunluk), sonuç sitedan:
// utm_content = Meta reklam kimliği. Ziyaret/lead/ödeme formu ds_events'ten (çerez onaylı),
// satış ve ciro ds_orders'tan (webhook'un yazdığı kaynak).
// GET ?gun=30 = rapor; POST = Meta'dan son 30 günü şimdi çek.
export const maxDuration = 60;

type Satir = {
  ad_id: string;
  ad_ad: string | null;
  kampanya_ad: string | null;
  adset_ad: string | null;
  para_birimi: string | null;
  harcama: number;
  gosterim: number;
  link_tiklama: number;
  video_3sn: number;
  siklik_max: number;
  ziyaretci: number;
  lead: number;
  odeme_formu: number;
  satis: number;
  ciro: number;
};

// Supabase tek istekte 1000 satır döner; aralık büyürse sayfala.
async function hepsi<T>(sorgu: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await sorgu(i, i + 999);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const gun = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("gun")) || 30));
  const since = new Date(Date.now() - gun * 864e5);
  const sinceGun = since.toISOString().slice(0, 10);

  try {
    type Harcama = { ad_id: string; ad_ad: string | null; kampanya_ad: string | null; adset_ad: string | null; para_birimi: string | null; harcama: number; gosterim: number; link_tiklama: number; video_3sn: number; siklik: number | null; tarih: string };
    type Olay = { event_type: string; session_id: string | null; email: string | null; utm_content: string };
    type Siparis = { amount: number; currency: string | null; utm_content: string };

    const [harcamalar, olaylar, siparisler, sonSenkron] = await Promise.all([
      hepsi<Harcama>((a, b) =>
        supabaseAdmin.from("ds_reklam_gunluk")
          .select("ad_id, ad_ad, kampanya_ad, adset_ad, para_birimi, harcama, gosterim, link_tiklama, video_3sn, siklik, tarih")
          .gte("tarih", sinceGun).order("tarih").range(a, b)),
      hepsi<Olay>((a, b) =>
        supabaseAdmin.from("ds_events")
          .select("event_type, session_id, email, utm_content")
          .not("utm_content", "is", null)
          .in("event_type", ["page_view", "lead", "checkout_open"])
          .gte("created_at", since.toISOString()).order("created_at").range(a, b)),
      hepsi<Siparis>((a, b) =>
        supabaseAdmin.from("ds_orders")
          .select("amount, currency, utm_content")
          .eq("payment_status", "paid")
          .not("utm_content", "is", null)
          .gte("created_at", since.toISOString()).order("created_at").range(a, b)),
      supabaseAdmin.from("ds_reklam_gunluk").select("guncellendi_at").order("guncellendi_at", { ascending: false }).limit(1),
    ]);

    const tablo = new Map<string, Satir>();
    const satir = (id: string) => {
      let s = tablo.get(id);
      if (!s) {
        s = { ad_id: id, ad_ad: null, kampanya_ad: null, adset_ad: null, para_birimi: null, harcama: 0, gosterim: 0, link_tiklama: 0, video_3sn: 0, siklik_max: 0, ziyaretci: 0, lead: 0, odeme_formu: 0, satis: 0, ciro: 0 };
        tablo.set(id, s);
      }
      return s;
    };

    for (const h of harcamalar) {
      const s = satir(h.ad_id);
      s.ad_ad = h.ad_ad; s.kampanya_ad = h.kampanya_ad; s.adset_ad = h.adset_ad; s.para_birimi = h.para_birimi;
      s.harcama += Number(h.harcama); s.gosterim += h.gosterim; s.link_tiklama += h.link_tiklama; s.video_3sn += h.video_3sn;
      s.siklik_max = Math.max(s.siklik_max, Number(h.siklik) || 0);
    }

    // Aynı kişiyi iki kez sayma: ziyaret ve ödeme formu oturum başına, lead e-posta (yoksa oturum) başına.
    const tekil = new Map<string, Set<string>>();
    for (const o of olaylar) {
      const kim = o.event_type === "lead" ? o.email || o.session_id : o.session_id;
      if (!kim) continue;
      const anahtar = `${o.utm_content}|${o.event_type}`;
      const set = tekil.get(anahtar) || new Set<string>();
      set.add(kim);
      tekil.set(anahtar, set);
    }
    for (const [anahtar, set] of tekil) {
      const [id, tur] = anahtar.split("|");
      const s = satir(id);
      if (tur === "page_view") s.ziyaretci = set.size;
      else if (tur === "lead") s.lead = set.size;
      else s.odeme_formu = set.size;
    }

    for (const o of siparisler) {
      const s = satir(o.utm_content);
      s.satis += 1;
      s.ciro += Number(o.amount);
    }

    const reklamlar = [...tablo.values()].sort((a, b) => b.harcama - a.harcama || b.lead - a.lead);
    return NextResponse.json({ gun, reklamlar, son_senkron: sonSenkron.data?.[0]?.guncellendi_at || null, hesap_bagli: !!process.env.META_AD_ACCOUNT_ID });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    return NextResponse.json(await metaReklamSenkron(30));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
