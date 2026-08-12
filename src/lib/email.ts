// Paylaşılan e-posta gönderimi — Resend REST API (fetch, ekstra bağımlılık yok).
// RESEND_API_KEY yoksa sessizce atlanır (akışı asla bozmaz).
// RESEND_FROM: doğrulanmış gönderen (ör. "Startup Doktoru <bilgi@startupdoktoru.com>").

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

// "Ad <mail@site.com>" veya "mail@site.com" biçimini doğrular.
// Yanlış yapılandırılmış bir reply-to (ör. yer tutucu) tüm gönderimi düşürmesin diye.
function validAddress(v?: string | null): boolean {
  if (!v) return false;
  const m = v.match(/<([^>]+)>\s*$/);
  const addr = (m ? m[1] : v).trim();
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(addr);
}

export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string; headers?: Record<string, string> }): Promise<{ sent: boolean; skipped?: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Startup Doktoru <onboarding@resend.dev>";
  const fallbackReply = process.env.RESEND_REPLY_TO || "doktorstartup@gmail.com";
  let replyTo = opts.replyTo || fallbackReply;
  if (!validAddress(replyTo)) {
    console.error("Geçersiz reply-to yok sayıldı:", replyTo);
    replyTo = validAddress(fallbackReply) ? fallbackReply : "doktorstartup@gmail.com";
  }
  if (!apiKey) return { sent: false, skipped: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, reply_to: replyTo, headers: opts.headers }),
    });
    if (!res.ok) {
      const error = await res.text();
      console.error("Resend error:", error);
      return { sent: false, error };
    }
    // Resend başarılı gönderimde { id } döndürür → takip için provider_id olarak saklanır.
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("sendEmail error:", error);
    return { sent: false, error };
  }
}

export function shell(body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#0E1726;line-height:1.6">
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
    <p style="font-size:12px;color:#9ca3af">Startup Doktoru · Eser Memişoğlu · <a href="${SITE}" style="color:#00B8CC">${SITE.replace(/^https?:\/\//, "")}</a></p>
  </div>`;
}

// HTML enjeksiyonuna karşı basit kaçış (bildirim maillerinde kullanıcı verisi için).
export function esc(s: string) {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
}

// Yöneticiye bilgilendirme maili (yeni kayıt / yeni satış). Varsayılan: esermemisoglu@gmail.com.
export async function notifyAdmin(subject: string, bodyHtml: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || "esermemisoglu@gmail.com";
  return sendEmail({ to, subject: `[Startup Doktoru] ${subject}`, html: shell(bodyHtml) });
}
