// Loglu e-posta gönderimi: sendEmail'i çağırır ve sonucu ds_email_messages defterine yazar.
// Böylece "hangi mailler gönderildi" kayda geçer; provider_id ile webhook açılma/tıklama/bounce işler.
// Resend kapalıysa (skipped) kayıt tutulmaz — akış eskisi gibi sessizce atlanır.
import { supabaseAdmin } from "./supabase";
import { sendEmail } from "./email";

export type EmailContext = "drip" | "broadcast" | "invest" | "transactional" | "test";

export async function sendLogged(
  opts: { to: string; subject: string; html: string; replyTo?: string; headers?: Record<string, string> },
  ctx: { context: EmailContext; contextRef?: string | null },
): Promise<{ sent: boolean; skipped?: boolean; id?: string; error?: string }> {
  const r = await sendEmail(opts);
  if (r.skipped) return r; // Resend yok → deftere yazma

  await supabaseAdmin.from("ds_email_messages").insert([
    {
      provider_id: r.id ?? null,
      context: ctx.context,
      context_ref: ctx.contextRef ?? null,
      to_email: opts.to,
      subject: opts.subject,
      status: r.sent ? "sent" : "failed",
      error: r.sent ? null : (r.error || "send_failed").slice(0, 500),
      sent_at: r.sent ? new Date().toISOString() : null,
    },
  ]);
  return r;
}
