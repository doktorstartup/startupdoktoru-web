import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Admin tarafından manuel erişim açma/kaldırma.
// ds_orders'a payment_method='manual', payment_status='paid' satır ekler →
// mevcut /api/access bu satırları otomatik tanır (ödeme gerekmeden erişim).
// ADMIN_PASSWORD env ile korunur; tanımlı değilse işlem reddedilir (güvenli varsayılan).

const VALID_PRODUCTS = [
  "ebook_13_steps",
  "investor_training",
  "startup_giris",
  "degerleme",
  "all_access_bundle",
];

const checkAuth = verifyAdminPassword;

export async function POST(req: NextRequest) {
  try {
    const { password, email, recipients, productIds, action = "grant", name } = await req.json();

    const auth = checkAuth(password);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Alıcılar: çoklu (recipients: [{email,name}]) ya da tekli (email/name) — geriye uyumlu.
    const rawRecipients: { email: string; name?: string }[] = Array.isArray(recipients) && recipients.length
      ? recipients
      : [{ email, name }];

    const targets = rawRecipients
      .map((r) => ({ email: typeof r.email === "string" ? r.email.trim().toLowerCase() : "", name: typeof r.name === "string" ? r.name.trim() : "" }))
      .filter((r) => r.email.includes("@"));

    if (targets.length === 0) {
      return NextResponse.json({ error: "Geçerli bir e-posta gerekli." }, { status: 400 });
    }

    const products = Array.isArray(productIds) ? productIds.filter((p) => VALID_PRODUCTS.includes(p)) : [];
    if (products.length === 0) {
      return NextResponse.json({ error: "En az bir geçerli ürün seçin." }, { status: 400 });
    }

    const emails = targets.map((t) => t.email);

    if (action === "revoke") {
      // Yalnızca manuel açılan erişimleri kaldır (gerçek ödemelere dokunma).
      for (const productId of products) {
        const { error } = await supabaseAdmin
          .from("ds_orders")
          .delete()
          .eq("payment_method", "manual")
          .eq("product_id", productId)
          .in("email", emails);
        if (error) console.error("Grant revoke error:", error.message);
      }
      return NextResponse.json({ ok: true, action: "revoke", emails, products, count: emails.length });
    }

    // grant: her alıcı × ürün için manuel ödenmiş sipariş satırı (idempotent — payment_ref UNIQUE).
    const rows = targets.flatMap((t) =>
      products.map((productId) => ({
        product_id: productId,
        email: t.email,
        customer_name: t.name || name || t.email,
        amount: 0,
        currency: "USD",
        payment_status: "paid",
        payment_method: "manual",
        payment_ref: `manual:${t.email}:${productId}`,
      }))
    );

    const { error } = await supabaseAdmin
      .from("ds_orders")
      .upsert(rows, { onConflict: "payment_ref", ignoreDuplicates: true });

    if (error) {
      console.error("Grant insert error:", error.message);
      return NextResponse.json({ error: "Erişim açılamadı: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: "grant", emails, products, count: emails.length });
  } catch (error) {
    console.error("Grant API error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  }
}

// Bir e-postanın mevcut (ödenmiş) erişimlerini döndürür — admin önizlemesi için.
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get("password");
  const email = req.nextUrl.searchParams.get("email");

  const auth = checkAuth(password);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) {
    return NextResponse.json({ error: "E-posta gerekli." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("ds_orders")
    .select("product_id, payment_method, amount, created_at")
    .eq("payment_status", "paid")
    .ilike("email", normalized);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ email: normalized, orders: data || [] });
}
