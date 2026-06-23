import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { enroll } from "../../../lib/campaigns";

// Ödeme ekranını ödeme adımına (PaymentIntent) ulaşmadan kapatan kişiyi yakalar.
// Lead'i 'checkout_started' etiketiyle işaretler (admin sepeti-bırakanlarda görünür) +
// sepeti-bırakma serisine kaydeder. Idempotent: tekrar çağrılırsa çift kayıt/mail olmaz.
export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    const normEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normEmail.includes("@")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const safeName = typeof name === "string" && name ? name : normEmail;

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
      await supabaseAdmin.from("ds_leads").update(patch).eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("ds_leads").insert([
        { name: safeName, email: normEmail, source: "checkout", status: "HOT", score: 75, stage: "NEW_LEAD", tags: ["checkout_started"] },
      ]);
    }

    await enroll("abandoned", null, { email: normEmail, name: safeName });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
