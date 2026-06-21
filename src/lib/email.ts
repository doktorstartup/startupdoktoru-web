// Paylaşılan e-posta gönderimi — Resend REST API (fetch, ekstra bağımlılık yok).
// RESEND_API_KEY yoksa sessizce atlanır (akışı asla bozmaz).
// RESEND_FROM: doğrulanmış gönderen (ör. "Startup Doktoru <bilgi@startupdoktoru.com>").

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ sent: boolean; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Startup Doktoru <onboarding@resend.dev>";
  if (!apiKey) return { sent: false, skipped: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (e) {
    console.error("sendEmail error:", e instanceof Error ? e.message : e);
    return { sent: false };
  }
}

function shell(body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#0E1726;line-height:1.6">
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
    <p style="font-size:12px;color:#9ca3af">Startup Doktoru · Eser Memişoğlu · <a href="${SITE}" style="color:#00B8CC">${SITE.replace(/^https?:\/\//, "")}</a></p>
  </div>`;
}

export function welcomeEmail(name?: string) {
  const ad = name ? ` ${name}` : "";
  return {
    subject: "Hoş geldin — Startup Doktoru 🚀",
    html: shell(`
      <h2 style="color:#0E1726">Hoş geldin${ad}! 🎉</h2>
      <p>Girişimini yatırım alınabilir, kârlı bir sisteme dönüştürme yolculuğuna katıldın.</p>
      <p><strong>13 Adımda Milyon Dolarlık Startup</strong> e-kitabı şu an <span style="text-decoration:line-through;color:#9ca3af">12 $</span> yerine <strong style="color:#00B8CC">6 $</strong>.</p>
      <p><a href="${SITE}/ebook" style="display:inline-block;background:#00B8CC;color:#001;padding:12px 22px;border-radius:10px;font-weight:bold;text-decoration:none">Hemen 6 $'a Sahip Ol →</a></p>
      <p style="font-size:14px;color:#6b7280">Ücretsiz 12 dakikalık eğitimimizi de izleyebilirsin: <a href="${SITE}/free-training" style="color:#00B8CC">Ücretsiz Eğitim</a></p>
    `),
  };
}

export function followupEmail(name?: string) {
  const ad = name ? ` ${name}` : "";
  return {
    subject: "Girişimin için bir sonraki adım — Startup Doktoru",
    html: shell(`
      <h2 style="color:#0E1726">Merhaba${ad},</h2>
      <p>Geçen gün aramıza katıldın ama e-kitabı henüz edinmemişsin. Sana özel hatırlatma:</p>
      <p><strong>13 Adımda Milyon Dolarlık Startup</strong> — değerleme, yatırımcı sunumu ve büyüme; hepsi tek el kitabında. Sadece <strong style="color:#00B8CC">6 $</strong>.</p>
      <p><a href="${SITE}/ebook" style="display:inline-block;background:#00B8CC;color:#001;padding:12px 22px;border-radius:10px;font-weight:bold;text-decoration:none">E-Kitabı İncele →</a></p>
    `),
  };
}
