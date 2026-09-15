import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Girişim profillerinin yönetimi — şifre korumalı. Girişimciler /api/me/startup ile
// kendi profillerini oluşturur; burada admin inceler (onayla/reddet) ve düzenler.
// Yalnız 'approved' profiller eşleştirmeye ve yatırımcı deal-flow'una girer.
const FIELDS = ["startup_name", "one_liner", "value_prop", "deck_url", "website", "sectors", "stage", "team_size", "city", "notes"];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const auth = verifyAdminPassword(sp.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let query = supabaseAdmin.from("inv_startup_profiles").select("*").order("updated_at", { ascending: false }).limit(1000);
  const status = sp.get("status");
  if (status && status !== "all") query = query.eq("status", status);
  const q = (sp.get("q") || "").trim();
  if (q) {
    const like = `%${q}%`;
    query = query.or(`startup_name.ilike.${like},email.ilike.${like},one_liner.ilike.${like},value_prop.ilike.${like},city.ilike.${like}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message, startups: [] }, { status: 500 });
  return NextResponse.json({ startups: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const action = body.action;
  const T = supabaseAdmin.from("inv_startup_profiles");

  try {
    if (action === "update") {
      if (!body.id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const f of FIELDS) if (body[f] !== undefined) patch[f] = body[f];
      const { error } = await T.update(patch).eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "set_status") {
      if (!body.id || !["submitted", "approved", "rejected"].includes(body.status)) {
        return NextResponse.json({ error: "id + geçerli status gerekli." }, { status: 400 });
      }
      const { error } = await T.update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      if (!body.id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
      const { error } = await T.delete().eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
  }
}
