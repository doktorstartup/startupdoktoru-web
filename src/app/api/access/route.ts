import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

// E-posta ile erişim sorgusu: ödenmiş siparişlerden sahip olunan ürünleri döner.
// all_access_bundle → 3 eğitimin tamamına erişim olarak açılır.
const BUNDLE_GRANTS = ["investor_training", "startup_giris", "degerleme"];

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-posta gerekli." }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin
      .from("ds_orders")
      .select("product_id")
      .eq("payment_status", "paid")
      .ilike("email", normalized);

    if (error) {
      console.error("Access query error:", error.message);
      return NextResponse.json({ owned: [], found: false });
    }

    const owned = new Set<string>();
    for (const row of data || []) {
      if (!row.product_id) continue;
      owned.add(row.product_id);
      if (row.product_id === "all_access_bundle") {
        BUNDLE_GRANTS.forEach((p) => owned.add(p));
      }
    }

    return NextResponse.json({ owned: Array.from(owned), found: owned.size > 0 });
  } catch (error) {
    console.error("Access API error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ owned: [], found: false });
  }
}
