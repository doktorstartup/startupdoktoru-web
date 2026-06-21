import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Admin UI kapısı için şifre doğrulama. Sadece geçerli/geçersiz döner.
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: undefined }));
  const auth = verifyAdminPassword(password);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ ok: true });
}
