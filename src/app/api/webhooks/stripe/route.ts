import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "../../../../lib/stripe";
import { supabaseAdmin } from "../../../../lib/supabase";

// productId → lead aşaması/skoru eşlemesi
const LEAD_BY_PRODUCT: Record<string, { stage: string; score: number }> = {
  ebook_13_steps: { stage: "EBOOK_CUSTOMER", score: 40 },
  investor_training: { stage: "COURSE_CUSTOMER", score: 90 },
};

export async function POST(req: NextRequest) {
  const body = await req.text(); // imza doğrulaması için ham gövde
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig || "", webhookSecret);
  } catch (err) {
    console.error("Webhook imza doğrulama hatası:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Geçersiz imza." }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { productId, email, name } = pi.metadata || {};

    // Sipariş kaydı (service role — RLS bypass).
    // payment_ref UNIQUE olduğundan upsert ile webhook tekrarında mükerrer önlenir.
    const { error: orderError } = await supabaseAdmin.from("ds_orders").upsert(
      [
        {
          product_id: productId,
          email: email || null,
          customer_name: name || null,
          amount: pi.amount / 100,
          currency: (pi.currency || "usd").toUpperCase(),
          payment_status: "paid",
          payment_method: "stripe",
          payment_ref: pi.id,
        },
      ],
      { onConflict: "payment_ref", ignoreDuplicates: true }
    );
    if (orderError) {
      console.error("Order upsert error:", orderError.message);
    }

    // İlgili lead'i müşteriye çevir; lead yoksa oluştur (önce form doldurmamış alıcı).
    const leadUpdate = productId ? LEAD_BY_PRODUCT[productId] : undefined;
    if (email && leadUpdate) {
      const { data: updated, error: leadError } = await supabaseAdmin
        .from("ds_leads")
        .update({ status: "CUSTOMER", stage: leadUpdate.stage, score: leadUpdate.score })
        .eq("email", email)
        .select("id");

      if (leadError) {
        console.error("Lead update error:", leadError.message);
      } else if (!updated || updated.length === 0) {
        const { error: insertError } = await supabaseAdmin.from("ds_leads").insert([
          {
            email,
            name: name || email,
            source: "checkout",
            status: "CUSTOMER",
            stage: leadUpdate.stage,
            score: leadUpdate.score,
          },
        ]);
        if (insertError) {
          console.error("Lead insert error:", insertError.message);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
