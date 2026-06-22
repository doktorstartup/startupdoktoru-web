import { NextRequest, NextResponse } from "next/server";
import { enroll } from "../../../lib/campaigns";

// Yeni lead → 'lead' tetikli kampanyalara kaydet (Karşılama gecikme 0 anında gider).
export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await enroll("lead", null, { email, name: typeof name === "string" ? name : undefined });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
