import { NextRequest, NextResponse } from "next/server";
import { suppress, verifyUnsubToken, normalizeEmail } from "../../../lib/suppression";

// Abonelikten çıkma. İki yol:
//  GET  → kullanıcı maildeki bağlantıya tıklar (onay sayfası döner).
//  POST → Gmail/Apple "tek tık" (List-Unsubscribe-Post) otomatik çağırır.
// Bağlantı HMAC ile imzalıdır (başkasının adresini çıkaramasın).

export const runtime = "nodejs";

function page(title: string, message: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#050B14;color:#E5E7EB;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
  <div style="max-width:440px;padding:32px;text-align:center">
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px">${message}</p>
    <a href="${site}" style="color:#00B8CC;font-size:14px">← Startup Doktoru</a>
  </div>
</body></html>`;
}

async function handle(req: NextRequest): Promise<{ ok: boolean; title: string; message: string }> {
  const sp = req.nextUrl.searchParams;
  const email = normalizeEmail(sp.get("e") || "");
  const token = sp.get("t") || "";

  if (!email.includes("@") || !verifyUnsubToken(email, token)) {
    return { ok: false, title: "Bağlantı geçersiz", message: "Bu bağlantı geçersiz veya süresi dolmuş görünüyor. Yardım için bize yanıt verebilirsiniz." };
  }
  const saved = await suppress(email, "unsubscribed", "link");
  if (!saved) {
    // Kaydedemediysek "oldu" deme — kullanıcı mail almaya devam edecek.
    return { ok: false, title: "Kaydedemedik", message: "Teknik bir sorun nedeniyle çıkış talebini kaydedemedik. Bu e-postayı yanıtlarsan seni listeden hemen çıkarırız." };
  }
  return {
    ok: true,
    title: "Çıkışınız alındı",
    message: `<strong>${email}</strong> adresine artık bilgilendirme e-postası göndermeyeceğiz. Fikrinizi değiştirirseniz bize yazmanız yeterli.`,
  };
}

export async function GET(req: NextRequest) {
  const r = await handle(req);
  return new NextResponse(page(r.title, r.message), {
    status: r.ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Tek-tık (RFC 8058): gövde yok sayılır, imzalı sorgu parametreleri yeterli.
export async function POST(req: NextRequest) {
  const r = await handle(req);
  return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
}
