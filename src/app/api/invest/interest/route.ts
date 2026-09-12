import { NextRequest } from "next/server";
import { verifyInterestToken, markInterested } from "../../../../lib/invest-interest";

// "İlgileniyorum" bağlantısı hedefi. İmza doğrulanır → yatırımcı 'interested' + otomatik profil.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(title: string, heading: string, body: string): Response {
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f4f4f5;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
  <div style="max-width:460px;background:#fff;border-radius:16px;padding:40px 36px;box-shadow:0 10px 40px rgba(0,0,0,.06);text-align:center">
    ${heading}
    <p style="color:#374151;line-height:1.6;margin:14px 0 0">${body}</p>
    <p style="font-size:12px;color:#9ca3af;margin:28px 0 0">Startup Doktoru · Eser Memişoğlu</p>
  </div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get("i") || "";
  const t = sp.get("t") || "";

  if (!id || !verifyInterestToken(id, t)) {
    return page("Geçersiz bağlantı", `<h2 style="color:#111827;margin:0">Bağlantı geçersiz</h2>`,
      "Bu ilgi bağlantısı doğrulanamadı. Dilerseniz aldığınız e-postayı doğrudan yanıtlayarak bize ulaşabilirsiniz.");
  }

  const ok = await markInterested(id, "link");
  if (!ok) {
    return page("Bulunamadı", `<h2 style="color:#111827;margin:0">Kayıt bulunamadı</h2>`,
      "Bir şeyler ters gitti. Lütfen aldığınız e-postayı yanıtlayın; sizinle iletişime geçelim.");
  }

  return page("Teşekkürler", `<h2 style="color:#10b981;margin:0">Teşekkürler! 🎉</h2>`,
    "İlginiz bize ulaştı. Ekibimiz kısa süre içinde sizinle iletişime geçip Startup Doktoru platformuna erişiminizi oluşturacak.");
}
