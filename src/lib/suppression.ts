// Engelleme listesi: bir daha mail atılmayacak adresler (bounce/şikâyet/abonelikten çıkma/elle).
// Gönderim kapısı sendLogged içindedir; burası yalnız okuma/yazma + opt-out token üretimi.
import crypto from "crypto";
import { supabaseAdmin } from "./supabase";

export type SuppressReason = "bounced" | "complained" | "unsubscribed" | "manual";

export const normalizeEmail = (e: string) => (e || "").trim().toLowerCase();

export async function isSuppressed(email: string): Promise<boolean> {
  const to = normalizeEmail(email);
  if (!to) return false;
  const { data } = await supabaseAdmin.from("ds_email_suppressions").select("id").eq("email", to).limit(1);
  return !!(data && data.length > 0);
}

// Listeye ekle (zaten varsa dokunma — ilk kayıt nedeni korunur).
export async function suppress(email: string, reason: SuppressReason, source?: string | null) {
  const to = normalizeEmail(email);
  if (!to.includes("@")) return;
  await supabaseAdmin
    .from("ds_email_suppressions")
    .upsert([{ email: to, reason, source: source ?? null }], { onConflict: "email", ignoreDuplicates: true });
}

// Opt-out bağlantısı için imza. Kendi adresinden başkasını çıkaramasın diye HMAC.
// UNSUBSCRIBE_SECRET yoksa service-role anahtarından türetilir (ek env gerektirmez).
function secret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function unsubToken(email: string): string {
  return crypto.createHmac("sha256", secret()).update(normalizeEmail(email)).digest("hex").slice(0, 32);
}

export function verifyUnsubToken(email: string, token: string): boolean {
  if (!token) return false;
  const expected = Buffer.from(unsubToken(email));
  const got = Buffer.from(token);
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

// Maildeki abonelikten çıkma bağlantısı.
export function unsubUrl(email: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";
  const to = normalizeEmail(email);
  return `${site}/api/unsubscribe?e=${encodeURIComponent(to)}&t=${unsubToken(to)}`;
}
