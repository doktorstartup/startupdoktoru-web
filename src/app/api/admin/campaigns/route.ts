import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Drip kampanya yönetimi: kampanya + adım CRUD. Şifre korumalı. POST action ile dağıtılır.

export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: campaigns } = await supabaseAdmin
    .from("ds_campaigns")
    .select("id, name, trigger_type, trigger_value, enabled, created_at")
    .order("created_at");
  const { data: steps } = await supabaseAdmin
    .from("ds_campaign_steps")
    .select("id, campaign_id, step_order, delay_minutes, subject, body_html")
    .order("step_order");

  const byCampaign = (campaigns || []).map((c) => ({
    ...c,
    steps: (steps || []).filter((s) => s.campaign_id === c.id),
  }));
  return NextResponse.json({ campaigns: byCampaign });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const action = body.action;
  const T = supabaseAdmin.from("ds_campaigns");
  const S = supabaseAdmin.from("ds_campaign_steps");

  try {
    if (action === "create_campaign") {
      const { error } = await T.insert([
        { name: body.name || "Yeni Kampanya", trigger_type: body.trigger_type || "lead", trigger_value: body.trigger_value || null },
      ]);
      if (error) throw error;
    } else if (action === "update_campaign") {
      if (!body.id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
      const patch: Record<string, unknown> = {};
      for (const k of ["name", "trigger_type", "trigger_value", "enabled"]) if (body[k] !== undefined) patch[k] = body[k];
      const { error } = await T.update(patch).eq("id", body.id);
      if (error) throw error;
    } else if (action === "delete_campaign") {
      const { error } = await T.delete().eq("id", body.id);
      if (error) throw error;
    } else if (action === "add_step") {
      const { count } = await S.select("id", { count: "exact", head: true }).eq("campaign_id", body.campaign_id);
      const { error } = await S.insert([
        {
          campaign_id: body.campaign_id,
          step_order: (count || 0) + 1,
          delay_minutes: body.delay_minutes ?? 0,
          subject: body.subject || "Konu",
          body_html: body.body_html || "<p>İçerik</p>",
        },
      ]);
      if (error) throw error;
    } else if (action === "update_step") {
      if (!body.id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
      const patch: Record<string, unknown> = {};
      for (const k of ["delay_minutes", "subject", "body_html"]) if (body[k] !== undefined) patch[k] = body[k];
      const { error } = await S.update(patch).eq("id", body.id);
      if (error) throw error;
    } else if (action === "delete_step") {
      const { error } = await S.delete().eq("id", body.id);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
  }
}
