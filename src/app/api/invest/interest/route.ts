import { NextRequest } from "next/server";
import { verifyInterestToken, markInterested } from "../../../../lib/invest-interest";
import { supabaseAdmin } from "../../../../lib/supabase";

// "İlgileniyorum" bağlantısı hedefi: GET onay sayfası, POST ilgiyi kaydeder (imza doğrulanır → 'interested' + otomatik profil).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lang = "tr" | "en";

const T = {
  invalidTitle: { tr: "Geçersiz bağlantı", en: "Invalid link" },
  invalidBody: {
    tr: "Bu ilgi bağlantısı doğrulanamadı. Dilerseniz aldığınız e-postayı doğrudan yanıtlayarak bize ulaşabilirsiniz.",
    en: "We couldn't verify this link. You can simply reply to the email you received instead.",
  },
  confirmTitle: { tr: "İlginizi onaylayın", en: "Confirm your interest" },
  confirmBody: {
    tr: "Sizi platforma eklememizi istiyorsanız aşağıdaki butona basmanız yeterli.",
    en: "If you'd like to join the platform, just press the button below.",
  },
  confirmButton: { tr: "Evet, ilgileniyorum", en: "Yes, I'm interested" },
  notFoundTitle: { tr: "Kayıt bulunamadı", en: "Record not found" },
  notFoundBody: {
    tr: "Bir şeyler ters gitti. Lütfen aldığınız e-postayı yanıtlayın; sizinle iletişime geçelim.",
    en: "Something went wrong. Please reply to the email you received and we'll get in touch.",
  },
  thanksTitle: { tr: "Teşekkürler!", en: "Thank you!" },
  thanksBody: {
    tr: "İlginiz bize ulaştı. Ekibimiz kısa süre içinde sizinle iletişime geçip Startup Doktoru platformuna erişiminizi oluşturacak.",
    en: "We've received your interest. Our team will be in touch shortly to set up your access to the Startup Doktoru platform.",
  },
};

function page(lang: Lang, title: string, heading: string, body: string, extra = ""): Response {
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f4f4f5;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
  <div style="max-width:460px;background:#fff;border-radius:16px;padding:40px 36px;box-shadow:0 10px 40px rgba(0,0,0,.06);text-align:center">
    ${heading}
    <p style="color:#374151;line-height:1.6;margin:14px 0 0">${body}</p>
    ${extra}
    <p style="font-size:12px;color:#9ca3af;margin:28px 0 0">Startup Doktoru · Eser Memişoğlu</p>
  </div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

const h2 = (text: string, color = "#111827") => `<h2 style="color:${color};margin:0">${text}</h2>`;

// Yatırımcının dili (mail diliyle aynı kural): TR → Türkçe, gerisi İngilizce. Bulunamazsa İngilizce.
async function investorLang(id: string): Promise<Lang> {
  const { data } = await supabaseAdmin.from("inv_investors").select("country").eq("id", id).maybeSingle();
  return data?.country === "TR" ? "tr" : "en";
}

function invalid(lang: Lang): Response {
  return page(lang, T.invalidTitle[lang], h2(T.invalidTitle[lang]), T.invalidBody[lang]);
}

// GET HİÇBİR ŞEY YAZMAZ. Kurumsal mail tarayıcıları maildeki linkleri saniyeler içinde otomatik
// açar; GET'te işaretlemek sahte "ilgilenen" üretiyordu. İlgi yalnız butonla (POST) kaydedilir.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get("i") || "";
  const t = sp.get("t") || "";
  if (!id || !verifyInterestToken(id, t)) return invalid("en");

  const lang = await investorLang(id);
  const action = `/api/invest/interest?i=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`;
  const form = `<form method="post" action="${action}" style="margin:24px 0 0">
      <button type="submit" style="background:#2563eb;color:#fff;border:0;border-radius:10px;padding:13px 24px;font-size:15px;font-weight:600;cursor:pointer">${T.confirmButton[lang]}</button>
    </form>`;
  return page(lang, T.confirmTitle[lang], h2(T.confirmTitle[lang]), T.confirmBody[lang], form);
}

export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get("i") || "";
  const t = sp.get("t") || "";
  if (!id || !verifyInterestToken(id, t)) return invalid("en");

  const lang = await investorLang(id);
  const ok = await markInterested(id, "link");
  if (!ok) return page(lang, T.notFoundTitle[lang], h2(T.notFoundTitle[lang]), T.notFoundBody[lang]);
  return page(lang, T.thanksTitle[lang], h2(T.thanksTitle[lang], "#10b981"), T.thanksBody[lang]);
}
