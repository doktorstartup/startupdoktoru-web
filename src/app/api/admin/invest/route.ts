import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// INVEST yatırımcı DB yönetimi — şifre korumalı. GET: liste+filtre. POST: action ile CRUD + review.
const FIELDS = [
  "firm_name", "partner_name", "role", "email", "address_purpose", "website", "linkedin",
  "twitter", "thesis", "sectors", "stages", "ticket", "country", "city", "portfolio",
  "source_url", "notes", "tags",
];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const auth = verifyAdminPassword(sp.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let query = supabaseAdmin.from("inv_investors").select("*").order("updated_at", { ascending: false }).limit(1000);

  const status = sp.get("status");
  if (status && status !== "all") query = query.eq("status", status);
  const country = sp.get("country");
  if (country) query = query.eq("country", country);
  const sector = sp.get("sector");
  if (sector) query = query.contains("sectors", [sector]);
  const stage = sp.get("stage");
  if (stage) query = query.contains("stages", [stage]);
  const q = (sp.get("q") || "").trim();
  if (q) {
    const like = `%${q}%`;
    query = query.or(`firm_name.ilike.${like},partner_name.ilike.${like},email.ilike.${like},thesis.ilike.${like},city.ilike.${like}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message, investors: [] }, { status: 500 });
  return NextResponse.json({ investors: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const action = body.action;
  const T = supabaseAdmin.from("inv_investors");

  try {
    if (action === "create") {
      if (!body.firm_name || !String(body.firm_name).trim()) {
        return NextResponse.json({ error: "Firma adı gerekli." }, { status: 400 });
      }
      const row: Record<string, unknown> = { firm_name: String(body.firm_name).trim() };
      for (const f of FIELDS) if (body[f] !== undefined) row[f] = body[f];
      const { data, error } = await T.insert([row]).select("id");
      if (error) throw error;
      return NextResponse.json({ ok: true, id: data?.[0]?.id });
    }

    if (action === "update") {
      if (!body.id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const f of FIELDS) if (body[f] !== undefined) patch[f] = body[f];
      const { error } = await T.update(patch).eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "set_status") {
      if (!body.id || !["pending", "verified", "rejected"].includes(body.status)) {
        return NextResponse.json({ error: "id + geçerli status gerekli." }, { status: 400 });
      }
      // Plan kuralı: kaynaksız (source_url boş) satır 'verified' yapılamaz.
      if (body.status === "verified") {
        const { data: row } = await T.select("source_url").eq("id", body.id).single();
        if (!row?.source_url || !String(row.source_url).trim()) {
          return NextResponse.json({ error: "Kaynak (source_url) olmadan 'onaylı' yapılamaz." }, { status: 400 });
        }
      }
      const patch: Record<string, unknown> = { status: body.status, updated_at: new Date().toISOString() };
      patch.verified_by = body.status === "verified" ? (body.verified_by || "eser") : null;
      const { error } = await T.update(patch).eq("id", body.id);
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
