import { NextRequest, NextResponse } from "next/server";

// İndirim kodunu e-posta ile gönderir. RESEND_API_KEY yoksa sessizce atlanır
// (kod zaten pop-up'ta ekranda gösteriliyor). Resend REST API'si fetch ile
// çağrılır — ekstra npm bağımlılığı gerektirmez.
export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "E-posta ve kod zorunludur." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "Startup Doktoru <onboarding@resend.dev>";
    if (!apiKey) {
      // Graceful: anahtar yoksa mail atma, akışı bozma.
      return NextResponse.json({ success: true, skipped: true });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "İndirim kodun: %10 — Startup Doktoru",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2>Hoş geldin! 🎁</h2>
            <p>13 Adımda Milyon Dolarlık Startup e-kitabında geçerli <strong>%10 indirim kodun</strong>:</p>
            <p style="font-size:24px;font-weight:bold;letter-spacing:3px;color:#00B8CC">${code}</p>
            <p>Ödeme ekranında bu kodu girmen yeterli.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend error:", text);
      return NextResponse.json({ success: true, fallback: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send-discount error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true, fallback: true });
  }
}
