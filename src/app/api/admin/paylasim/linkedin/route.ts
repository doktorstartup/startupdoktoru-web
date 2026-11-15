import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../../lib/adminAuth";
import { LINKEDIN_DONUS } from "../../../../../lib/paylasim-platform";

// Admin: LinkedIn kişisel profil yetkisini başlatır. Dönüş: ./geri (anahtarı ds_paylasim_ayar'a yazar).
// LinkedIn uygulamasında "Share on LinkedIn" + "Sign In with LinkedIn using OpenID Connect" ürünleri ve
// bu dönüş adresi kayıtlı olmalı.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const istemci = process.env.LINKEDIN_CLIENT_ID;
  if (!istemci || !process.env.LINKEDIN_CLIENT_SECRET) {
    return NextResponse.json({ error: "LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET tanımlı değil." }, { status: 503 });
  }

  // Tek kullanımlık: dönüş ucu yalnız bu değerle gelen isteği kabul eder.
  const state = randomUUID();
  const { error } = await supabaseAdmin.from("ds_paylasim_ayar").update({ linkedin_state: state }).eq("id", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: istemci,
    redirect_uri: LINKEDIN_DONUS,
    state,
    scope: "openid profile w_member_social",
  }).toString();
  return NextResponse.json({ url: url.toString() });
}
