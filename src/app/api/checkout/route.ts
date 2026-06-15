import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { supabaseAdmin } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { productId, email, name } = await req.json();

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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(product.price) * 100), // en küçük para birimi (cents)
      currency: (product.currency || "usd").toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { productId: product.id, email, name },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Checkout error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Ödeme başlatılamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
