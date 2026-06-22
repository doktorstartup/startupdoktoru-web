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
    // Distinct ziyaretçi + sayfa kırılımı için page_view'leri çek (session_id + path).
    const { data: pageViews } = await supabaseAdmin
      .from("ds_events")
      .select("session_id, path")
      .eq("event_type", "page_view");

    const visitors = new Set((pageViews || []).map((e) => e.session_id).filter(Boolean)).size;

    // Sayfa bazlı görüntüleme + tekil ziyaretçi kırılımı (en çok görüntülenen ilk 12).
    const pageMap = new Map<string, { views: number; sessions: Set<string> }>();
    for (const e of pageViews || []) {
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
    const { data: paidOrders } = await supabaseAdmin
      .from("ds_orders")
      .select("amount")
      .eq("payment_status", "paid");

    const customers = (paidOrders || []).length;
    const revenue = (paidOrders || []).reduce((sum, o) => sum + Number(o.amount || 0), 0);

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

    return NextResponse.json({
      visitors,
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
