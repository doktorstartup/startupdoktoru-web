import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// CRM 360 — bir lead'in (e-posta bazlı) içeride ne yaptığı: siparişler/eğitimler,
// girişim profili ve mail aktivitesi tek çağrıda birleşir. Şifre korumalı.

const PRODUCT_NAMES: Record<string, string> = {
  ebook_13_steps: "Startup E-Kitabı",
  investor_training: "Yatırımcı Sunumu Eğitimi",
  startup_giris: "Startup Giriş Eğitimi",
  degerleme: "Değerleme Eğitimi",
  all_access_bundle: "Tüm Eğitimler Paketi",
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const auth = verifyAdminPassword(sp.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const email = (sp.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email gerekli." }, { status: 400 });

  // 1) Ödenmiş siparişler → sahip olduğu eğitim/ürünler
  const { data: orderRows } = await supabaseAdmin
    .from("ds_orders")
    .select("product_id, amount, currency, payment_status, created_at")
    .ilike("email", email)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });
  const orders = (orderRows || []).map((o) => ({
    product_id: o.product_id,
    name: PRODUCT_NAMES[o.product_id as string] || o.product_id,
    amount: o.amount,
    currency: o.currency,
    created_at: o.created_at,
  }));

  // 2) Girişim profili (varsa)
  const { data: profRows } = await supabaseAdmin
    .from("inv_startup_profiles")
    .select("startup_name, status, one_liner, value_prop, product_stage, valuation, team_size, deck_url, website, sectors, city, updated_at")
    .ilike("email", email)
    .order("updated_at", { ascending: false })
    .limit(1);
  const profile = profRows?.[0] || null;

  // 3) Mail aktivitesi
  const { data: mailRows } = await supabaseAdmin
    .from("ds_email_messages")
    .select("subject, status, context, opened_at, clicked_at, created_at")
    .ilike("to_email", email)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = mailRows || [];
  const mail = {
    total: rows.length,
    opened: rows.filter((m) => m.opened_at).length,
    clicked: rows.filter((m) => m.clicked_at).length,
    lastAt: rows[0]?.created_at || null,
    recent: rows.slice(0, 6).map((m) => ({
      subject: m.subject || "(konu yok)",
      status: m.status,
      opened: !!m.opened_at,
      clicked: !!m.clicked_at,
      created_at: m.created_at,
    })),
  };

  return NextResponse.json({ orders, profile, mail });
}
