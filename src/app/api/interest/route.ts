import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { enroll } from "../../../lib/campaigns";

// Üye bir eğitimin tanıtımını izlerse "interested:<productId>" tag'i + ilgi kampanyasına kayıt.
export async function POST(req: NextRequest) {
  try {
    const { email, productId } = await req.json();
    if (!email || !productId) {
      return NextResponse.json({ error: "E-posta ve ürün gerekli." }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();
    const tag = `interested:${productId}`;
    let leadName = "";

    const { data: lead } = await supabaseAdmin
      .from("ds_leads")
      .select("id, name, tags")
      .ilike("email", normalized)
      .maybeSingle();

    if (lead) {
      leadName = lead.name || "";
      const tags: string[] = lead.tags || [];
      if (!tags.includes(tag)) {
        await supabaseAdmin.from("ds_leads").update({ tags: [...tags, tag] }).eq("id", lead.id);
      }
    } else {
      await supabaseAdmin.from("ds_leads").insert([
        { name: normalized, email: normalized, source: "portal", status: "WARM", score: 15, stage: "NEW_LEAD", tags: [tag] },
      ]);
    }

    // İlgi tetikli kampanyaya kaydet (o eğitim için drip serisi başlar)
    await enroll("interest", productId, { email: normalized, name: leadName });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interest API error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true, fallback: true });
  }
}
