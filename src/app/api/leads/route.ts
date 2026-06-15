import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, company, startup_stage, source = "website" } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Ad, e-posta ve telefon zorunludur." },
        { status: 400 }
      );
    }

    // Upsert lead (if same email exists, update score and stage)
    const { data, error } = await supabaseAdmin
      .from("ds_leads")
      .upsert(
        [{
          name,
          email,
          phone,
          company: company || null,
          startup_stage: startup_stage || null,
          source,
          status: "NEW",
          score: 10,
          stage: "FREE_TRAINING"
        }],
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) {
      console.error("Lead upsert error:", error.message);
      // Graceful fallback — don't block user
      return NextResponse.json({ success: true, fallback: true });
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error) {
    console.error("Lead API error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true, fallback: true });
  }
}
