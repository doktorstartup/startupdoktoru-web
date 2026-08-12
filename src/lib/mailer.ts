// Loglu e-posta gönderimi: sendEmail'i çağırır ve sonucu ds_email_messages defterine yazar.
// Böylece "hangi mailler gönderildi" kayda geçer; provider_id ile webhook açılma/tıklama/bounce işler.
// Ayrıca TEK GÖNDERİM KAPISI: engelleme (suppression) listesindeki adrese pazarlama maili gitmez.
// Resend kapalıysa (skipped) kayıt tutulmaz — akış eskisi gibi sessizce atlanır.
import { supabaseAdmin } from "./supabase";
import { sendEmail } from "./email";
import { isSuppressed, normalizeEmail, unsubUrl } from "./suppression";

export type EmailContext = "drip" | "broadcast" | "invest" | "transactional" | "test";

// İşlem mailleri (fatura, erişim vb.) opt-out'a tabi değildir; diğerleri pazarlamadır.
const isMarketing = (c: EmailContext) => c !== "transactional";

function withUnsubFooter(html: string, url: string) {
  return `${html}
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:12px auto 0;text-align:center">
    <a href="${url}" style="font-size:11px;color:#9ca3af">Bu e-postaları almak istemiyorum</a>
  </div>`;
}

export async function sendLogged(
  opts: { to: string; subject: string; html: string; replyTo?: string; headers?: Record<string, string> },
  ctx: { context: EmailContext; contextRef?: string | null },
): Promise<{ sent: boolean; skipped?: boolean; suppressed?: boolean; id?: string; error?: string }> {
  const to = normalizeEmail(opts.to);

  // Kapı: engellenmiş adrese pazarlama maili gönderme (deftere 'suppressed' olarak yazılır).
  if (isMarketing(ctx.context) && (await isSuppressed(to))) {
    await supabaseAdmin.from("ds_email_messages").insert([
      {
        context: ctx.context,
        context_ref: ctx.contextRef ?? null,
        to_email: to,
        subject: opts.subject,
        status: "suppressed",
        error: "Engelleme listesinde",
      },
    ]);
    return { sent: false, suppressed: true };
  }

  // Pazarlama maillerine abonelikten çıkma bağlantısı + tek-tık başlıkları (deliverability).
  let html = opts.html;
  let headers = opts.headers;
  if (isMarketing(ctx.context)) {
    const url = unsubUrl(to);
    html = withUnsubFooter(html, url);
    headers = {
      ...(headers || {}),
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  const r = await sendEmail({ ...opts, to, html, headers });
  if (r.skipped) return r; // Resend yok → deftere yazma

  await supabaseAdmin.from("ds_email_messages").insert([
    {
      provider_id: r.id ?? null,
      context: ctx.context,
      context_ref: ctx.contextRef ?? null,
      to_email: to,
      subject: opts.subject,
      status: r.sent ? "sent" : "failed",
      error: r.sent ? null : (r.error || "send_failed").slice(0, 500),
      sent_at: r.sent ? new Date().toISOString() : null,
    },
  ]);
  return r;
}
