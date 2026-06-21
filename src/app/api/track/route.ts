import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

const VALID = new Set(["page_view", "lead", "purchase", "popup_view", "popup_submit"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type } = body;

    if (!VALID.has(event_type)) {
      return NextResponse.json({ error: "Geçersiz olay tipi." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("ds_events").insert([
      {
        event_type,
        session_id: body.session_id || null,
        path: body.path || null,
        referrer: body.referrer || null,
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        email: body.email || null,
        product_id: body.product_id || null,
        amount: typeof body.amount === "number" ? body.amount : null,
      },
    ]);

    if (error) {
      console.error("Event insert error:", error.message);
      return NextResponse.json({ success: true, fallback: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track API error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true, fallback: true });
  }
}
