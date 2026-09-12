// INVEST — kişiselleştirilmiş tier-1 davet e-postası.
// Yatırımcının fon/sektör/aşama bilgisini kullanır + sektörüne EŞLEŞEN portföy girişimini
// (inv_startups) örnek olarak koyar. Eşleşme yoksa girişim adı zorlanmaz (genel çerçeve).
// country='TR' → Türkçe, aksi halde İngilizce. shell() ile sarılır; sendLogged unsubscribe ekler.
import { interestUrl } from "./invest-interest";

type Inv = {
  id: string; firm_name: string; partner_name: string | null; country: string | null;
  sectors?: string[] | null; stages?: string[] | null; role?: string | null;
};

export type Startup = {
  name: string; disclose_name: boolean; descriptor: string | null;
  sectors: string[]; stages: string[]; one_liner: string; ask: string | null; hero: boolean;
};

const firstName = (inv: Inv) => (inv.partner_name || "").trim().split(/\s+/)[0] || "";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Yatırımcının sektörleriyle en çok örtüşen aktif girişimi seç (örtüşme yoksa null).
function matchStartup(inv: Inv, startups: Startup[]): Startup | null {
  const invSecs = (inv.sectors || []).map(norm).filter(Boolean);
  if (!invSecs.length || !startups.length) return null;
  let best: Startup | null = null;
  let bestScore = 0;
  for (const st of startups) {
    const stSecs = (st.sectors || []).map(norm);
    let overlap = 0;
    for (const a of invSecs) {
      if (stSecs.some((b) => a === b || a.includes(b) || b.includes(a))) overlap++;
    }
    const score = overlap * 10 + (st.hero ? 1 : 0);
    if (overlap > 0 && score > bestScore) { best = st; bestScore = score; }
  }
  return best;
}

const label = (st: Startup) => (st.disclose_name ? st.name : (st.descriptor || "one of our startups"));

export function campaignEmail(inv: Inv, startups: Startup[] = []): { subject: string; html: string } {
  const link = interestUrl(inv.id);
  const fn = firstName(inv);
  const isTR = (inv.country || "TR") === "TR";
  const st = matchStartup(inv, startups);
  const firm = inv.firm_name || "";
  const secs = (inv.sectors || []).slice(0, 3).join(", ");
  const stages = (inv.stages || []).slice(0, 2).join("/");

  if (isTR) {
    const hi = fn ? `Merhaba ${fn},` : "Merhaba,";
    const follow = firm
      ? `<b>${firm}</b>'in ${stages ? `${stages} aşamasında ` : ""}${secs ? `${secs} alanlarındaki ` : ""}çalışmalarını takip ediyorum. `
      : "";
    const example = st
      ? `Şu an içeride bir örnek: <b>${label(st)}</b> — ${st.one_liner}.${st.ask ? ` Şu anda ${st.ask}.` : ""}`
      : `${secs ? `${secs} alanlarında ` : ""}yatırıma hazır girişimler programdan sürekli mezun oluyor.`;
    return {
      subject: "Davet: elenmiş, yatırıma hazır Türk girişimleri",
      html: `<p>${hi}</p>
<p>${follow}Startup Doktoru'nu yönetiyorum — girişimcilerin yatırımcıyla tanışmadan <i>önce</i> yoğun bir hazırlık programından geçtiği bir ekosistem. Sonuç: ham dealflow değil, yalnızca başarı ihtimali gerçekten yüksek girişimlerle görüşürsünüz.</p>
<p>${example}</p>
<p>Türkiye girişim ekosistemi hızla büyüyor ve giriş değerlemeleri düşük — global hedefli erken yatırımcı için yüksek getiri katları demek.</p>
<p>Elenmiş, tezinize uygun Türk dealflow'u ilginizi çekiyorsa sizi platforma eklemek isterim: <a href="${link}"><b>İlgileniyorum →</b></a><br>
<span style="color:#6b7280;font-size:13px">Bu e-postayı yanıtlamanız da yeterli.</span></p>
<p>Saygılarımla,<br>Eser Memişoğlu — Startup Doktoru</p>`,
    };
  }

  const hi = fn ? `Hi ${fn},` : "Hi there,";
  const follow = firm
    ? `I follow <b>${firm}</b>'s work${stages ? ` backing ${stages}-stage founders` : ""}${secs ? ` across ${secs}` : ""}. `
    : "";
  const example = st
    ? `One example currently inside is <b>${label(st)}</b> — ${st.one_liner}.${st.ask ? ` It's ${st.ask}.` : ""}`
    : `Founders building in ${secs || "your focus areas"} come through the program continuously.`;
  return {
    subject: "An invitation: pre-vetted, investor-ready Turkish startups",
    html: `<p>${hi}</p>
<p>${follow}I run Startup Doktoru — a Turkish ecosystem where founders go through an intensive preparation program <i>before</i> they ever reach an investor, so you only meet teams with a genuinely high probability of success, not raw dealflow.</p>
<p>${example}</p>
<p>Turkey's ecosystem is growing fast, with low entry valuations — outsized multiples for early investors with global ambition.</p>
<p>If curated, thesis-matched Turkish dealflow is interesting to you, I'd love to add you to the platform: <a href="${link}"><b>I'm interested →</b></a><br>
<span style="color:#6b7280;font-size:13px">A quick reply to this email works too.</span></p>
<p>Best,<br>Eser Memişoğlu — Startup Doktoru</p>`,
  };
}
