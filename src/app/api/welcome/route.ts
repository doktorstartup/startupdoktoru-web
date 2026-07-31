import { NextRequest, NextResponse } from "next/server";
import { enroll } from "../../../lib/campaigns";
import { supabaseAdmin } from "../../../lib/supabase";
import { notifyAdmin, esc } from "../../../lib/email";

// Yeni üye → lead'i garantile + 'lead' tetikli kampanyalara kaydet (Karşılama gecikme 0 anında gider).
// Idempotent: hem email+şifre hem Google akışından çağrılabilir; lead/enrollment çift oluşmaz.
export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const normEmail = email.trim().toLowerCase();
    const safeName = typeof name === "string" && name ? name : normEmail;
    const src = typeof source === "string" && source ? source : "signup";

    // Lead yoksa oluştur (özellikle Google ile girenler CRM'e düşsün).
    const { data: existing } = await supabaseAdmin
      .from("ds_leads")
      .select("id, tags")
      .ilike("email", normEmail)
      .limit(1);

    let leadId: string | undefined;
    let tags: string[] = [];
    if (existing && existing.length > 0) {
      leadId = existing[0].id;
      tags = existing[0].tags || [];
    } else {
      const { data: created } = await supabaseAdmin
        .from("ds_leads")
        .insert([{ name: safeName, email: normEmail, source: src, status: "NEW", score: 15, stage: "NEW_LEAD" }])
        .select("id");
      leadId = created?.[0]?.id;
    }

    // Admin'e "yeni kayıt" bilgilendirmesi — kişi başına bir kez (admin_notified etiketiyle dedup).
    if (leadId && !tags.includes("admin_notified")) {
      await notifyAdmin(
        `Yeni kayıt: ${safeName}`,
        `<h2 style="margin:0 0 8px;font-size:18px">Yeni kullanıcı kaydı 🎉</h2>
         <p style="margin:0"><strong>Ad:</strong> ${esc(safeName)}<br/>
         <strong>E-posta:</strong> ${esc(normEmail)}<br/>
         <strong>Kaynak:</strong> ${esc(src)}</p>`
      );
      await supabaseAdmin.from("ds_leads").update({ tags: [...tags, "admin_notified"] }).eq("id", leadId);
    }

    await enroll("lead", null, { email: normEmail, name: typeof name === "string" ? name : undefined });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
