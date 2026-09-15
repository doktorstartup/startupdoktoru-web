// Üye (girişimci / yatırımcı) oturum doğrulaması — sunucu tarafı.
// İstemci, Supabase oturumundaki access_token'ı Authorization: Bearer ile yollar;
// burada service-role client ile JWT doğrulanır ve kullanıcı (id + e-posta) çıkarılır.
// Admin şifresinden (adminAuth) ayrıdır: bu, giriş yapmış son-kullanıcıyı kanıtlar.
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase";

export type MemberUser = { id: string; email: string };

export async function verifyMember(
  req: NextRequest,
): Promise<{ user: MemberUser | null; error?: string; status?: number }> {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (!token) return { user: null, error: "Oturum bulunamadı.", status: 401 };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.email) {
    return { user: null, error: "Geçersiz veya süresi dolmuş oturum.", status: 401 };
  }
  return { user: { id: data.user.id, email: data.user.email.toLowerCase() } };
}
