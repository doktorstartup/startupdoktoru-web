// INVEST — kişiselleştirilmiş tier-1 davet e-postası.
// Yatırımcının fon/sektör/aşama bilgisini kullanır + sektörüne EŞLEŞEN portföy girişimlerini
// (inv_startups) kısa asansör-cümlesiyle örnek verir (2'ye kadar). Eşleşme yoksa marka zorlanmaz.
// country='TR' → Türkçe, aksi halde İngilizce. shell() ile sarılır; sendLogged unsubscribe ekler.
import { interestUrl } from "./invest-interest";

// Duraklatma anahtarı: true yapıp deploy edince davet kampanyası durur; bekçi de "cron durdu" uyarısı vermez.
// Nerede kaldığımız inv_outreach (segment='tier1-invite') dedup'ında saklı → false yapınca sıradaki
// temaslanmamış partiden sürer, kimseye tekrar gitmez.
export const INVEST_CAMPAIGN_PAUSED = false;

// A/B testi (2026-11): son 76 kişi rastgele ikiye bölündü. Bu etiketi taşıyan B grubu kısa pitch'i alır;
// A grubu mevcut daveti. Karşılaştırma yalnız onay butonu ve gerçek cevapla yapılır.
const AB_PITCH_TAG = "ab_2026_11_b";

type Inv = {
  id: string; firm_name: string; partner_name: string | null; country: string | null;
  sectors?: string[] | null; stages?: string[] | null; role?: string | null; tags?: string[] | null;
};

export type Startup = {
  name: string; disclose_name: boolean; descriptor: string | null;
  sectors: string[]; stages: string[]; one_liner: string; ask: string | null; hero: boolean;
};

const firstName = (inv: Inv) => (inv.partner_name || "").trim().split(/\s+/)[0] || "";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const label = (st: Startup) => (st.disclose_name ? st.name : (st.descriptor || "one of our startups"));

// Yatırımcının sektörleriyle örtüşen aktif girişimler (skora göre sıralı, en fazla 2).
function matchStartups(inv: Inv, startups: Startup[]): Startup[] {
  const invSecs = (inv.sectors || []).map(norm).filter(Boolean);
  if (!invSecs.length || !startups.length) return [];
  const scored: { st: Startup; score: number }[] = [];
  for (const st of startups) {
    const stSecs = (st.sectors || []).map(norm);
    let overlap = 0;
    for (const a of invSecs) if (stSecs.some((b) => a === b || a.includes(b) || b.includes(a))) overlap++;
    if (overlap > 0) scored.push({ st, score: overlap * 10 + (st.hero ? 1 : 0) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((x) => x.st);
}

function examplesBlock(matched: Startup[], lang: "tr" | "en"): string {
  if (matched.length === 1) {
    const st = matched[0];
    return lang === "tr"
      ? `<p>Şu an içeride bir örnek: <b>${label(st)}</b> — ${st.one_liner}.${st.ask ? ` Şu anda ${st.ask}.` : ""}</p>`
      : `<p>One example currently inside is <b>${label(st)}</b> — ${st.one_liner}.${st.ask ? ` It's ${st.ask}.` : ""}</p>`;
  }
  const items = matched
    .map((st) => `<li style="margin:0 0 6px"><b>${label(st)}</b> — ${st.one_liner}${st.ask ? ` (${st.ask})` : ""}.</li>`)
    .join("");
  const intro = lang === "tr" ? "İçeriden birkaç örnek:" : "A couple of examples currently inside:";
  return `<p style="margin:0 0 6px">${intro}</p><ul style="margin:0;padding-left:18px">${items}</ul>`;
}

// B şablonu: tek girişim, rakamlar önde, kısa. Eşleşme yoksa öne çıkan girişime düşer.
function pitchEmail(inv: Inv, startups: Startup[]): { subject: string; html: string } {
  const st = matchStartups(inv, startups)[0] || startups.find((x) => x.hero) || startups[0];
  const name = label(st);
  const fn = firstName(inv);
  const firm = (inv.firm_name || "").trim();
  const secs = (inv.sectors || []).slice(0, 2).join(" and ");
  const who = firm && firm !== (inv.partner_name || "").trim() ? firm : "you";
  const reason = secs ? `Reaching out because ${who} ${who === "you" ? "back" : "backs"} ${secs}. ` : "";
  return {
    subject: "A Turkish startup raising now — worth a look?",
    html: `<p>${fn ? `Hi ${fn},` : "Hi there,"}</p>
<p>${reason}I run Startup Doktoru, a Turkish program that prepares founders before they meet investors.</p>
<p><b>${name.charAt(0).toUpperCase() + name.slice(1)}</b> — ${st.one_liner}.${st.ask ? ` It's ${st.ask}.` : ""}</p>
<p>If you'd like the deck, just reply to this email, or tap here: <a href="${interestUrl(inv.id)}"><b>I'm interested →</b></a></p>
<p>Best,<br>Eser Memişoğlu — Startup Doktoru</p>`,
  };
}

export function campaignEmail(inv: Inv, startups: Startup[] = []): { subject: string; html: string } {
  if (startups.length && inv.tags?.includes(AB_PITCH_TAG)) return pitchEmail(inv, startups);

  const link = interestUrl(inv.id);
  const fn = firstName(inv);
  const isTR = (inv.country || "TR") === "TR";
  const matched = matchStartups(inv, startups);
  const firm = inv.firm_name || "";
  const secs = (inv.sectors || []).slice(0, 3).join(", ");
  const stages = (inv.stages || []).slice(0, 2).join("/");

  if (isTR) {
    const hi = fn ? `Merhaba ${fn},` : "Merhaba,";
    const follow = firm
      ? `<b>${firm}</b>'in ${stages ? `${stages} aşamasında ` : ""}${secs ? `${secs} alanlarındaki ` : ""}çalışmalarını takip ediyorum. `
      : "";
    const example = matched.length
      ? examplesBlock(matched, "tr")
      : `<p>${secs ? `${secs} alanlarında ` : ""}yatırıma hazır girişimler programdan sürekli mezun oluyor.</p>`;
    return {
      subject: "Davet: elenmiş, yatırıma hazır Türk girişimleri",
      html: `<p>${hi}</p>
<p>${follow}Startup Doktoru'nu yönetiyorum — girişimcilerin yatırımcıyla tanışmadan <i>önce</i> yoğun bir hazırlık programından geçtiği bir ekosistem. Sonuç: ham dealflow değil, yalnızca başarı ihtimali gerçekten yüksek girişimlerle görüşürsünüz.</p>
${example}
<p>Türkiye girişim ekosistemi hızla büyüyor ve giriş değerlemeleri düşük — global hedefli erken yatırımcı için yüksek getiri katları demek.</p>
<p>Ayrıca dönem dönem düzenlediğimiz etkinliklerle girişimci ve yatırımcıları bizzat bir araya getiriyoruz.</p>
<p>Elenmiş, tezinize uygun Türk dealflow'u ilginizi çekiyorsa sizi platforma eklemek isterim: <a href="${link}"><b>İlgileniyorum →</b></a><br>
<span style="color:#6b7280;font-size:13px">Bu e-postayı yanıtlamanız da yeterli.</span></p>
<p>Saygılarımla,<br>Eser Memişoğlu — Startup Doktoru</p>`,
    };
  }

  const hi = fn ? `Hi ${fn},` : "Hi there,";
  const follow = firm
    ? `I follow <b>${firm}</b>'s work${stages ? ` backing ${stages}-stage founders` : ""}${secs ? ` across ${secs}` : ""}. `
    : "";
  const example = matched.length
    ? examplesBlock(matched, "en")
    : `<p>Founders building in ${secs || "your focus areas"} come through the program continuously.</p>`;
  return {
    subject: "An invitation: pre-vetted, investor-ready Turkish startups",
    html: `<p>${hi}</p>
<p>${follow}I run Startup Doktoru — a Turkish ecosystem where founders go through an intensive preparation program <i>before</i> they ever reach an investor, so you only meet teams with a genuinely high probability of success, not raw dealflow.</p>
${example}
<p>Turkey's ecosystem is growing fast, with low entry valuations — outsized multiples for early investors with global ambition.</p>
<p>We also host periodic events that bring founders and investors together in person.</p>
<p>If curated, thesis-matched Turkish dealflow is interesting to you, I'd love to add you to the platform: <a href="${link}"><b>I'm interested →</b></a><br>
<span style="color:#6b7280;font-size:13px">A quick reply to this email works too.</span></p>
<p>Best,<br>Eser Memişoğlu — Startup Doktoru</p>`,
  };
}
