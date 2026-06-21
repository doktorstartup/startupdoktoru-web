import { NextRequest, NextResponse } from "next/server";
import { sendEmail, welcomeEmail } from "../../../lib/email";

// Yeni lead'e karşılama e-postası. Lead kaydı ayrı yapılır; burası sadece mail atar.
// RESEND_API_KEY yoksa sessizce atlanır (akış bozulmaz).
export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const { subject, html } = welcomeEmail(typeof name === "string" ? name : undefined);
    const r = await sendEmail({ to: email, subject, html });
    return NextResponse.json({ ok: true, sent: r.sent, skipped: r.skipped });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
