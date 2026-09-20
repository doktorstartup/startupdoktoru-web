import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";
import { shell, esc } from "../../../../lib/email";
import { sendLogged } from "../../../../lib/mailer";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

// Reddedilen profile: otomatik eksik raporu + admin notu + ilgili eğitim linkleri.
type Prof = { startup_name?: string | null; one_liner?: string | null; value_prop?: string | null; product_stage?: string | null; valuation?: string | null; deck_url?: string | null; team_size?: number | null };
function feedbackEmail(p: Prof, message?: string) {
  const gaps: string[] = [];
  const trainings: string[] = [];
  if (!(p.one_liner || "").trim()) gaps.push("Asansör konuşması (tek cümlede ne yaptığın) eksik.");
  if (!(p.value_prop || "").trim()) gaps.push("Değer önerisi (problem–çözüm–neden sen) eksik ya da zayıf.");
  if (!(p.product_stage || "").trim()) gaps.push("Ürün durumu belirtilmemiş (Fikir / MVP / İlk müşteriler / MRR / Growth).");
  if (!(p.valuation || "").trim()) {
    gaps.push("Değerleme yok — yatırımcı “ne kadar, hangi değerleme?” diye sorar.");
    trainings.push(`<li><a href="${SITE}/degerleme">Değerleme eğitimi</a> — şirket değerini nasıl koyacağını öğren.</li>`);
  }
  if (!(p.deck_url || "").trim()) {
    gaps.push("Yatırımcı sunumu (pitch deck) linki yok — ilk izlenim burada oluşur.");
    trainings.push(`<li><a href="${SITE}/investor-training">Yatırımcı Sunumu eğitimi</a> — sıfırdan etkili bir deck kur.</li>`);
  }
  if (p.team_size == null) gaps.push("Ekip bilgisi (kaç kişi) eksik.");

  const gapsHtml = gaps.length ? `<ul>${gaps.map((g) => `<li>${g}</li>`).join("")}</ul>` : "<p>Profilin genel olarak iyi; küçük düzenlemelerle daha da güçlenir.</p>";
  const trainingHtml = trainings.length
    ? `<p>Şu eğitimler bu konularda sana yardımcı olur:</p><ul>${trainings.join("")}</ul>`
    : `<p>Daha fazlası için <a href="${SITE}/egitimler">eğitimlerimize</a> göz atabilirsin.</p>`;
  const noteHtml = message && message.trim() ? `<p style="border-left:3px solid #2563eb;padding-left:10px;color:#374151"><strong>Notumuz:</strong> ${esc(message.trim())}</p>` : "";

  return `
    <p>Merhaba,</p>
    <p><strong>${esc(p.startup_name || "girişimin")}</strong> profilini inceledik. Seni yatırımcıların karşısına en güçlü halinle çıkarmak istiyoruz — bunun için güncellemeni önerdiğimiz birkaç nokta var:</p>
    ${gapsHtml}
    ${noteHtml}
    ${trainingHtml}
    <p>Bunları güncelleyip <a href="${SITE}/portal/startup"><strong>profilini tekrar gönder</strong></a> — hazır olduğunda seni tezine uygun yatırımcılarla eşleştireceğiz.</p>
    <p>Başarılar,<br/>Startup Doktoru</p>
  `;
}

// Girişim profillerinin yönetimi — şifre korumalı. Girişimciler /api/me/startup ile
// kendi profillerini oluşturur; burada admin inceler (onayla/reddet) ve düzenler.
// Yalnız 'approved' profiller eşleştirmeye ve yatırımcı deal-flow'una girer.
const FIELDS = ["startup_name", "one_liner", "value_prop", "deck_url", "website", "sectors", "stage", "team_size", "city", "product_stage", "valuation", "email", "notes"];

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
    if (action === "create") {
      // Admin-eklenen profil (üye hesabı yok → user_id null). Founder self-servis akışından ayrı.
      const name = String(body.startup_name || "").trim();
      if (!name) return NextResponse.json({ error: "Girişim adı gerekli." }, { status: 400 });
      const row: Record<string, unknown> = { startup_name: name, status: body.status || "submitted", email: body.email || null };
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
      if (!body.id || !["submitted", "approved", "rejected"].includes(body.status)) {
        return NextResponse.json({ error: "id + geçerli status gerekli." }, { status: 400 });
      }
      const { error } = await T.update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "reject_notify") {
      // Reddet + founder'a otomatik eksik raporu + admin notu + eğitim linkleriyle mail gönder.
      if (!body.id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
      const { data: p } = await T.select("*").eq("id", body.id).single();
      if (!p) return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
      const message = typeof body.message === "string" ? body.message : "";
      await T.update({ status: "rejected", review_feedback: message.trim() || null, updated_at: new Date().toISOString() }).eq("id", body.id);

      const to = (p.email || "").trim().toLowerCase();
      let sent = false;
      const emailed = to.includes("@");
      if (emailed) {
        const r = await sendLogged(
          { to, subject: `${p.startup_name || "Girişimin"} — profil geri bildirimi`, html: shell(feedbackEmail(p, message)) },
          { context: "transactional", contextRef: p.id, personal: true },
        );
        sent = r.sent;
      }
      return NextResponse.json({ ok: true, emailed, sent });
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
