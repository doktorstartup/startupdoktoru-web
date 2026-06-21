// Admin parolası doğrulaması — sunucu tarafı. ADMIN_PASSWORD env ile.
// Tanımlı değilse tüm admin işlemleri reddedilir (güvenli varsayılan).
export function verifyAdminPassword(password: unknown): { ok: boolean; status?: number; error?: string } {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, status: 503, error: "ADMIN_PASSWORD tanımlı değil. Sunucuya ekleyin." };
  }
  if (typeof password !== "string" || password !== expected) {
    return { ok: false, status: 401, error: "Yanlış yönetici şifresi." };
  }
  return { ok: true };
}
