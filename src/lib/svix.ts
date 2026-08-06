// Svix webhook imza doğrulaması (Resend webhook'ları Svix ile imzalanır).
// Ekstra bağımlılık yok — Node crypto ile HMAC-SHA256.
// secret: "whsec_<base64>" · signedContent: "<svix-id>.<svix-timestamp>.<rawBody>"
import crypto from "crypto";

const TOLERANCE_SEC = 5 * 60; // zaman damgası penceresi (replay koruması)

export function verifySvix(
  secret: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  rawBody: string,
): boolean {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;

  // Zaman damgası penceresi
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SEC) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
  const expectedBuf = Buffer.from(expected);

  // Header birden çok imza taşıyabilir: "v1,<sig> v1,<sig2>"
  for (const part of signature.split(" ")) {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) return true;
  }
  return false;
}
