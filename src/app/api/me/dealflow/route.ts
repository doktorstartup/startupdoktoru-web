import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyMember } from "../../../../lib/memberAuth";
import { shell, esc, notifyAdmin } from "../../../../lib/email";
import { sendLogged } from "../../../../lib/mailer";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

// Yatırımcı deal-flow'u — giriş yapmış ve portala davet edilmiş yatırımcıya özel.
// Kimlik: oturumdaki e-posta = inv_investors.email/email_secondary + portal_enabled.
// GET: yatırımcının profili + eşleştirilen ONAYLI girişimler (geçilenler hariç), her birinde aksiyon.
// POST: bir girişim için "requested" (görüşme talebi) / "skipped" (geç) kaydı;
//       action "click" + target deck|website → ilgi analizi için tıklama sayacı.
// PATCH: yatırımcı kendi profilini (isim, rol, tez, sektör, aşama, ticket) düzenler.

const INV_FIELDS = "id, firm_name, partner_name, role, thesis, sectors, stages, ticket, portal_enabled";

async function findInvestor(email: string) {
  const { data } = await supabaseAdmin
    .from("inv_investors")
    .select(INV_FIELDS)
    .or(`email.eq.${email},email_secondary.eq.${email}`)
    .eq("portal_enabled", true)
    .maybeSingle();
  return data;
}

export async function GET(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const inv = await findInvestor(user.email);
  if (!inv) return NextResponse.json({ investor: null, startups: [] });

  const { data: matches } = await supabaseAdmin
    .from("inv_matches")
    .select("id, startup_id, investor_action, viewed_at")
    .eq("investor_id", inv.id);

  const rows = matches || [];
  // İzlenme analizi: ilk görüntülemede viewed_at damgala (fire-and-forget).
  const unseen = rows.filter((m) => !m.viewed_at).map((m) => m.id);
  if (unseen.length) supabaseAdmin.from("inv_matches").update({ viewed_at: new Date().toISOString() }).in("id", unseen).then(() => {});

  // Geçilenler (skipped) listede gösterilmez.
  const actionByStartup = new Map(rows.map((m) => [m.startup_id, m.investor_action]));
  const ids = rows.filter((m) => m.investor_action !== "skipped").map((m) => m.startup_id);

  let startups: Record<string, unknown>[] = [];
  if (ids.length) {
    const { data } = await supabaseAdmin
      .from("inv_startup_profiles")
      .select("id, startup_name, one_liner, value_prop, deck_url, website, sectors, stage, team_size, city, product_stage, valuation, sd_trained")
      .in("id", ids)
      .eq("status", "approved")
      .order("updated_at", { ascending: false });
    const list = data || [];

    // Global ilgi (tüm yatırımcılardan gelen "görüşme talebi") → trend vitrini: popüler üste.
    const { data: allReq } = await supabaseAdmin
      .from("inv_matches")
      .select("startup_id")
      .eq("investor_action", "requested")
      .in("startup_id", list.map((s) => s.id));
    const cmap: Record<string, number> = {};
    for (const r of allReq || []) cmap[r.startup_id as string] = (cmap[r.startup_id as string] || 0) + 1;

    startups = list
      .map((s) => ({ ...s, action: actionByStartup.get(s.id) || null, interest_count: cmap[s.id] || 0 }))
      .sort((a, b) => (b.interest_count as number) - (a.interest_count as number));
  }

  // Son haberler: İngilizce yayınlanmış son blog yazıları.
  const { data: news } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("title, slug, seo_description, cover_image, created_at")
    .eq("durum", "yayinda")
    .eq("lang", "en")
    .order("created_at", { ascending: false })
    .limit(3);

  return NextResponse.json({ investor: inv, startups, news: news || [] });
}

export async function PATCH(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const inv = await findInvestor(user.email);
  if (!inv) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of ["partner_name", "role", "ticket", "thesis"]) {
    if (typeof body[f] !== "string") continue;
    patch[f] = body[f].trim().slice(0, f === "thesis" ? 2000 : 200) || null;
  }
  for (const f of ["sectors", "stages"]) {
    if (!Array.isArray(body[f])) continue;
    patch[f] = body[f]
      .filter((x: unknown): x is string => typeof x === "string")
      .map((x: string) => x.trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 20);
  }

  const { data, error: dbErr } = await supabaseAdmin
    .from("inv_investors")
    .update(patch)
    .eq("id", inv.id)
    .select(INV_FIELDS)
    .single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ investor: data });
}

export async function POST(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const body = await req.json().catch(() => ({}));
  if (!body.startup_id || !["requested", "skipped", "click"].includes(body.action)) {
    return NextResponse.json({ error: "startup_id + geçerli action gerekli." }, { status: 400 });
  }

  const inv = await findInvestor(user.email);
  if (!inv) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  if (body.action === "click") {
    if (!["deck", "website"].includes(body.target)) return NextResponse.json({ error: "Geçersiz target." }, { status: 400 });
    const col = `${body.target}_clicks`;
    const { data: m } = await supabaseAdmin
      .from("inv_matches")
      .select("id, deck_clicks, website_clicks")
      .eq("investor_id", inv.id)
      .eq("startup_id", body.startup_id)
      .maybeSingle();
    if (m) {
      await supabaseAdmin
        .from("inv_matches")
        .update({ [col]: ((m as Record<string, number>)[col] || 0) + 1, [`${body.target}_clicked_at`]: new Date().toISOString() })
        .eq("id", m.id);
    }
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = { investor_action: body.action, action_at: new Date().toISOString() };
  if (body.action === "skipped") {
    patch.skip_reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 300) : null;
  }
  if (body.action === "requested") patch.meeting_status = "open"; // admin bekleyen kuyruğuna girer
  const { error: dbErr } = await supabaseAdmin
    .from("inv_matches")
    .update(patch)
    .eq("investor_id", inv.id)
    .eq("startup_id", body.startup_id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // Görüşme talebinde bildirim: admin (koordinasyon) + girişimci (motivasyon).
  if (body.action === "requested") {
    try {
      const { data: sp } = await supabaseAdmin
        .from("inv_startup_profiles")
        .select("startup_name, email")
        .eq("id", body.startup_id)
        .maybeSingle();
      const invName = inv.partner_name || inv.firm_name;
      const startupName = sp?.startup_name || "bir girişim";

      await notifyAdmin(
        "Yeni görüşme talebi 🤝",
        `<p><strong>${esc(invName)}</strong> (${esc(inv.firm_name)}) — <strong>${esc(startupName)}</strong> ile görüşmek istedi.</p><p>Eşleştirme panelinden koordine et: ${SITE}/admin/match</p>`,
      );

      if (sp?.email && sp.email.includes("@")) {
        await sendLogged(
          {
            to: sp.email,
            subject: "Bir yatırımcı seninle görüşmek istiyor 🎉",
            html: shell(`
              <p>Harika haber!</p>
              <p><strong>${esc(inv.firm_name)}</strong>, <strong>${esc(startupName)}</strong> ile görüşmek istedi. Bu güçlü bir sinyal — en kısa sürede koordinasyon için seninle iletişime geçeceğiz.</p>
              <p>Bu arada <a href="${SITE}/portal/startup">profilini</a> güncel ve güçlü tuttuğundan emin ol.</p>
              <p>Başarılar,<br/>Startup Doktoru</p>
            `),
          },
          { context: "transactional", contextRef: body.startup_id, personal: true },
        );
      }
    } catch { /* bildirim best-effort; talep zaten kaydedildi */ }
  }

  return NextResponse.json({ ok: true });
}
