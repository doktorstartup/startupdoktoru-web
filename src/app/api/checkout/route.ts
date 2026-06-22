import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { supabaseAdmin } from "../../../lib/supabase";
import { enroll } from "../../../lib/campaigns";

// İndirim kodunu doğrular; geçerliyse percent_off döner, değilse null.
// Geçersiz kod satışı ENGELLEMEZ — sessizce indirimsiz devam eder.
async function resolveDiscount(code: string | undefined, productId: string): Promise<{ code: string; percentOff: number } | null> {
  if (!code) return null;
  const { data, error } = await supabaseAdmin
    .from("ds_discount_codes")
    .select("code, percent_off, product_id, active, expires_at, max_uses, used_count")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !data) return null;
  if (!data.active) return null;
  if (data.product_id && data.product_id !== productId) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  if (data.max_uses != null && data.used_count >= data.max_uses) return null;

  return { code: data.code, percentOff: data.percent_off };
}

export async function POST(req: NextRequest) {
  try {
    const { productId, email, name, phone, discountCode } = await req.json();

    if (!productId || !email || !name) {
      return NextResponse.json(
        { error: "Ürün, e-posta ve ad zorunludur." },
        { status: 400 }
      );
    }

    // Fiyatı ds_products'tan al — client'tan gelen tutara güvenme.
    const { data: product, error: productError } = await supabaseAdmin
      .from("ds_products")
      .select("id, title, price, currency")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Geçersiz ürün." }, { status: 404 });
    }

    // İndirim kodu sunucu tarafında yeniden doğrulanır ve fiyat burada düşürülür.
    const discount = await resolveDiscount(discountCode, product.id);
    const basePrice = Number(product.price);
    const finalPrice = discount
      ? Math.max(0.5, basePrice * (1 - discount.percentOff / 100)) // Stripe min ~$0.50
      : basePrice;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalPrice * 100), // en küçük para birimi (cents)
      currency: (product.currency || "usd").toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        productId: product.id,
        email,
        name,
        ...(phone ? { phone } : {}),
        ...(discount ? { discountCode: discount.code, percentOff: String(discount.percentOff) } : {}),
      },
    });

    // Sepeti-bırakma takibi: ödeme adımına gelen kişiyi yakala (checkout_started).
    // Ödeme tamamlanmazsa abandoned olarak kalır; webhook satışta CUSTOMER yapar.
    try {
      const normEmail = String(email).trim().toLowerCase();
      const { data: existing } = await supabaseAdmin
        .from("ds_leads")
        .select("id, tags, status")
        .ilike("email", normEmail)
        .limit(1);
      if (existing && existing.length > 0) {
        const tags: string[] = existing[0].tags || [];
        if (!tags.includes("checkout_started")) tags.push("checkout_started");
        const patch: Record<string, unknown> = { tags };
        if (existing[0].status !== "CUSTOMER") {
          patch.status = "HOT";
          patch.score = 75;
        }
        if (phone) patch.phone = phone;
        await supabaseAdmin.from("ds_leads").update(patch).eq("id", existing[0].id);
      } else {
        await supabaseAdmin.from("ds_leads").insert([
          { name, email: normEmail, phone: phone || null, source: "checkout", status: "HOT", score: 75, stage: "NEW_LEAD", tags: ["checkout_started"] },
        ]);
      }
      // Sepeti bırakma kampanyasına kaydet (tamamlamazsa drip başlar)
      await enroll("abandoned", null, { email: normEmail, name });
    } catch (e) {
      console.error("Checkout lead capture error:", e instanceof Error ? e.message : e);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      originalPrice: basePrice,
      finalPrice,
      discountApplied: discount ? discount.percentOff : 0,
    });
  } catch (error) {
    console.error("Checkout error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Ödeme başlatılamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
