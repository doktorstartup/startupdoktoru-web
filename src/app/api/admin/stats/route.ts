import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Admin funnel istatistikleri: ziyaretçi → lead → müşteri + dönüşüm oranları.
// Ziyaretçi = ds_events'teki distinct session_id (page_view).
// Şifre korumalı — lead e-postaları ve ciro burada döner.
export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    // Tüm olaylar tek sorguda: sayfa kırılımı da kanal kırılımı da buradan çıkar.
    const { data: tumOlaylar } = await supabaseAdmin
      .from("ds_events")
      .select("session_id, path, event_type, referrer, utm_source, utm_medium, created_at")
      .order("created_at", { ascending: true });

    const tumPageViews = (tumOlaylar || []).filter((e) => e.event_type === "page_view");

    // Yönetim paneli gezintisi ziyaretçi değil: huni oranlarını şişiriyordu.
    // (Panel artık hiç izlenmiyor; bu filtre geçmiş kayıtlar için.)
    const pageViews = (tumPageViews || []).filter((e) => !(e.path || "").startsWith("/admin"));

    const visitors = new Set(pageViews.map((e) => e.session_id).filter(Boolean)).size;

    // Sayfa bazlı görüntüleme + tekil ziyaretçi kırılımı (en çok görüntülenen ilk 12).
    const pageMap = new Map<string, { views: number; sessions: Set<string> }>();
    for (const e of pageViews) {
      const path = e.path || "/";
      if (!pageMap.has(path)) pageMap.set(path, { views: 0, sessions: new Set() });
      const rec = pageMap.get(path)!;
      rec.views += 1;
      if (e.session_id) rec.sessions.add(e.session_id);
    }
    const topPages = Array.from(pageMap.entries())
      .map(([path, r]) => ({ path, views: r.views, visitors: r.sessions.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 12);

    // Lead sayısı
    const { count: leads } = await supabaseAdmin
      .from("ds_leads")
      .select("id", { count: "exact", head: true });

    // Ödenmiş siparişler (müşteri + gelir)
    // .not product_id: paylaşılan Stripe hesabına gelen YABANCI ödemeler (bizim checkout'umuzdan
    // çıkmadığı için productId taşımaz) ciroya ve müşteri sayısına GİRMEZ — yalnız bizim satışlarımız.
    const { data: paidOrders } = await supabaseAdmin
      .from("ds_orders")
      .select("id, email, amount")
      .eq("payment_status", "paid")
      .not("product_id", "is", null);

    const revenue = (paidOrders || []).reduce((sum, o) => sum + Number(o.amount || 0), 0);

    // "Müşteri" = para ödemiş TEKİL kişi; ödenmiş sipariş satırı değil. İki fark var:
    // bir kişi birden çok ürün alabiliyor, ve admin panelinden verilen ücretsiz
    // erişimler de ds_orders'a paid satır olarak düşüyor (payment_method='manual',
    // amount=0). Satır sayısı ikisini de müşteri sayıyordu.
    const customers = new Set(
      (paidOrders || []).filter((o) => Number(o.amount || 0) > 0).map((o) => o.email || o.id)
    ).size;

    // Son lead'ler
    const { data: recentLeads } = await supabaseAdmin
      .from("ds_leads")
      .select("id, name, email, company, score, stage, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Son siparişler
    const { data: recentOrders } = await supabaseAdmin
      .from("ds_orders")
      .select("id, email, product_id, amount, currency, payment_status, created_at")
      .not("product_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    // Sepeti bırakanlar: ödeme adımına gelmiş (checkout_started) ama müşteri olmamış.
    const { data: abandoned } = await supabaseAdmin
      .from("ds_leads")
      .select("id, name, email, phone, created_at")
      .neq("status", "CUSTOMER")
      .contains("tags", ["checkout_started"])
      .order("created_at", { ascending: false })
      .limit(10);

    const leadCount = leads || 0;
    const leadRate = visitors > 0 ? (leadCount / visitors) * 100 : 0;
    const saleRate = leadCount > 0 ? (customers / leadCount) * 100 : 0;
    const overallRate = visitors > 0 ? (customers / visitors) * 100 : 0;

    // İngilizce baskı talep ölçümü: /en/ebook'ta e-posta bırakanlar.
    const { count: ebookEnInterest } = await supabaseAdmin
      .from("ds_ebook_en_interest")
      .select("id", { count: "exact", head: true });

    // ── Kanal kırılımı ────────────────────────────────────────────────────
    // Bir oturumun kanalı: kampanya etiketi varsa o, yoksa ilk dış referrer.
    // Etiket her zaman kazanır — Instagram uygulama içi tarayıcısı referrer'ı
    // çoğu zaman hiç göndermiyor, tek güvenilir sinyal utm.
    const kanalAdi = (referrer: string | null): string => {
      const r = (referrer || "").toLowerCase();
      if (!r) return "doğrudan";
      if (r.includes("startupdoktoru.com") || r.includes("localhost")) return "";
      if (r.includes("google.")) return "google (organik)";
      if (r.includes("instagram")) return "instagram";
      if (r.includes("facebook")) return "facebook";
      if (r.includes("youtube")) return "youtube";
      if (r.includes("chatgpt") || r.includes("openai")) return "chatgpt";
      if (r.includes("linkedin")) return "linkedin";
      if (r.includes("t.co") || r.includes("twitter") || r.includes("x.com")) return "x";
      if (r.includes("com.google.android.gm") || r.includes("mail.")) return "e-posta";
      try {
        return new URL(referrer!).hostname.replace(/^www\./, "");
      } catch {
        return "diğer";
      }
    };

    const oturumKanali = new Map<string, string>();
    const oturumLead = new Set<string>();
    const oturumSatis = new Set<string>();

    for (const e of tumOlaylar || []) {
      const sid = e.session_id;
      if (!sid || (e.path || "").startsWith("/admin")) continue;

      if (e.event_type === "lead") oturumLead.add(sid);
      if (e.event_type === "purchase") oturumSatis.add(sid);

      const mevcut = oturumKanali.get(sid);
      // Kampanya etiketi gördüğümüz an kanalı ona sabitle. Kısaltmalar açılır ki
      // etiketli trafik, referrer'dan tanınan aynı kanalla yan yana dursun.
      if (e.utm_source) {
        const takma: Record<string, string> = { ig: "instagram", fb: "facebook", yt: "youtube", li: "linkedin" };
        const kaynak = takma[e.utm_source.toLowerCase()] || e.utm_source;
        oturumKanali.set(sid, e.utm_medium ? `${kaynak} / ${e.utm_medium}` : kaynak);
        continue;
      }
      // Etiket yoksa yalnız ilk anlamlı referrer'ı yaz; sonrakiler ezmesin.
      if (!mevcut) {
        const ad = kanalAdi(e.referrer);
        if (ad) oturumKanali.set(sid, ad);
      }
    }

    const kanalMap = new Map<string, { ziyaretci: number; lead: number; satis: number }>();
    for (const [sid, kanal] of oturumKanali) {
      if (!kanalMap.has(kanal)) kanalMap.set(kanal, { ziyaretci: 0, lead: 0, satis: 0 });
      const r = kanalMap.get(kanal)!;
      r.ziyaretci += 1;
      if (oturumLead.has(sid)) r.lead += 1;
      if (oturumSatis.has(sid)) r.satis += 1;
    }

    const channels = Array.from(kanalMap.entries())
      .map(([kanal, r]) => ({ kanal, ...r }))
      .sort((a, b) => b.satis - a.satis || b.lead - a.lead || b.ziyaretci - a.ziyaretci);

    return NextResponse.json({
      visitors,
      channels,
      ebookEnInterest: ebookEnInterest || 0,
      leads: leadCount,
      customers,
      revenue,
      conversion: { leadRate, saleRate, overallRate },
      topPages,
      abandoned: abandoned || [],
      recentLeads: recentLeads || [],
      recentOrders: recentOrders || [],
    });
  } catch (error) {
    console.error("Admin stats error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        visitors: 0,
        channels: [],
        leads: 0,
        customers: 0,
        revenue: 0,
        conversion: { leadRate: 0, saleRate: 0, overallRate: 0 },
        topPages: [],
        abandoned: [],
        recentLeads: [],
        recentOrders: [],
        fallback: true,
      },
      { status: 200 }
    );
  }
}
