// PAYLAŞIM ANALİZİ — ara ara çalıştırılan, salt okuma rapor. Hiçbir şey yayınlamaz, veritabanına yazmaz.
// Kaynaklar: ds_sosyal_video (Reels + Shorts, günlük senkron), ds_ig_hikaye + ds_hikaye_kuyruk (hikâyeler),
// ds_carousel_kuyruk.ig_metrikler, scripts/video/projeler/*.json (kanca, müzik, efekt), Instagram hesap içgörüleri
// (günlük yeni takipçi, takip/bırakma, içerik türüne göre erişim — API yalnız son 30 günü verir; her çalışma
// günlük takipçi serisini çıktı klasöründeki gecmis.json'a ekler, böylece zamanla uzar).
// LinkedIn yok: uygulamanın gönderi istatistiği okuma izni yok.
//
// Kullanım: node scripts/analiz/paylasim-analizi.mjs [--gun 45] [--cikti <klasör>]
//   Rapor: ~/Desktop/Startup Doktoru Analiz/paylasim-analizi-YYYY-MM-DD.md
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(KOK, "../../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);
const arg = (ad, varsayilan) => (process.argv.includes(ad) ? process.argv[process.argv.indexOf(ad) + 1] : varsayilan);
const GUN = Number(arg("--gun", 45));
const CIKTI = arg("--cikti", join(homedir(), "Desktop", "Startup Doktoru Analiz"));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const veri = async (q) => {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
};

// Söz hikâyesi düzen testi (2026-11-23, Eser onayı): bu günlerde "yazı üstte" düzeni çıktı, diğerleri eski düzen.
const UST_DUZEN_GUNLERI = ["2026-11-26", "2026-11-28", "2026-11-30", "2026-12-02"];
// Business Suite'ten elle okunan referans (2026-11-21, son 90 gün; o dönem hikâyeler Facebook'a da gidiyordu).
const ESKI_SOZ_HIKAYE_ORTANCA = 950;

// ── yardımcılar ──
const ortanca = (a) => {
  const s = a.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const tr = (t, o) => new Date(t).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", ...o });
const gunAd = (t) => tr(t, { day: "2-digit", month: "2-digit", weekday: "short" });
const saat = (t) => Number(tr(t, { hour: "2-digit", hour12: false }));
const gunKey = (t) => new Date(new Date(t).getTime() + 3 * 3600000).toISOString().slice(0, 10); // TR günü
const n = (v, k = 0) => (v == null || Number.isNaN(v) ? "—" : Number(v).toLocaleString("tr-TR", { maximumFractionDigits: k }));
const yuzde = (v) => (v == null ? "—" : `%${Math.round(v * 100)}`);
const binde = (pay, payda) => (pay == null || !payda ? null : (pay / payda) * 1000);
const tablo = (basliklar, satirlar) =>
  [`| ${basliklar.join(" | ")} |`, `| ${basliklar.map(() => "---").join(" | ")} |`, ...satirlar.map((s) => `| ${s.join(" | ")} |`)].join("\n");
const kisalt = (s, k = 46) => {
  const t = (s || "").replace(/\s+/g, " ").replace(/\|/g, "/").trim();
  return t.length > k ? `${t.slice(0, k - 1)}…` : t;
};

// YouTube tutma eğrisi: [[sürenin oranı, izleyici oranı]] → belirli saniyedeki tutma ve en büyük kopuş.
const tutmaSn = (t, sure, sn) => {
  if (!t?.length || !sure) return null;
  const hedef = sn / sure;
  return (t.find(([x]) => x >= hedef) || t[t.length - 1])[1];
};
const enBuyukKopus = (t, sure) => {
  if (!t?.length || !sure) return null;
  let en = { sn: null, dusus: 0 };
  for (let i = 1; i < t.length; i++) {
    const d = t[i - 1][1] - t[i][1];
    if (d > en.dusus) en = { sn: Math.round(t[i][0] * sure), dusus: d };
  }
  return en;
};

// ── veri ──
const bas = new Date(Date.now() - GUN * 86400000).toISOString();
const doksan = new Date(Date.now() - 90 * 86400000).toISOString();
const olgun = new Date(Date.now() - 48 * 3600000).toISOString(); // 48 saati dolmamış gönderi kıyasa girmez

const tumVideo = await veri(db.from("ds_sosyal_video").select("platform, video_id, paylasim_id, baslik, yayin_at, sure_sn, metrikler, tutma"));
const paylasimlar = await veri(db.from("ds_paylasim").select("id, baslik, yayin_at, ai_icerik, ig_deneme"));
const hikayeler = await veri(db.from("ds_ig_hikaye").select("*").gte("yayin_at", bas));
const sozler = await veri(db.from("ds_hikaye_kuyruk").select("soz, yayin_at, durum, linkedin_durum, tiktok_durum").gte("yayin_at", bas));
const carousel = await veri(db.from("ds_carousel_kuyruk").select("baslik, yayin_at, durum, ig_metrikler").eq("durum", "yayinda"));

// Proje dosyaları: aynı başlıklı birden çok sürüm varsa en son değiştirilen.
const PROJE = join(KOK, "../video/projeler");
const projeler = {};
for (const f of readdirSync(PROJE).filter((f) => f.endsWith(".json"))) {
  try {
    const p = JSON.parse(readFileSync(join(PROJE, f), "utf8"));
    const b = p.paylasim?.baslik;
    if (!b) continue;
    const zaman = statSync(join(PROJE, f)).mtimeMs;
    if (!projeler[b] || projeler[b].zaman < zaman) projeler[b] = { ...p, zaman };
  } catch {
    /* bozuk/yarım proje dosyası raporu durdurmasın */
  }
}

// Instagram hesap içgörüleri (son 30 gün) + geçmiş birikimi.
const graf = async (yol) => {
  const r = await fetch(`https://graph.facebook.com/v23.0/${env.IG_USER_ID}${yol}&access_token=${env.IG_ACCESS_TOKEN}`);
  const j = await r.json();
  if (j.error) throw new Error(`Instagram: ${j.error.message}`);
  return j.data;
};
const s30 = Math.floor(Date.now() / 1000) - 29 * 86400;
const u30 = Math.floor(Date.now() / 1000);
let hesap = { takipci: null, yeni: {}, takip: null, birakma: null, erisim: [], uyari: null };
try {
  const [profil] = [await (await fetch(`https://graph.facebook.com/v23.0/${env.IG_USER_ID}?fields=followers_count&access_token=${env.IG_ACCESS_TOKEN}`)).json()];
  const fc = await graf(`/insights?metric=follower_count&period=day&since=${s30}&until=${u30}`);
  const fu = await graf(`/insights?metric=follows_and_unfollows&period=day&metric_type=total_value&breakdown=follow_type&since=${s30}&until=${u30}`);
  const er = await graf(`/insights?metric=reach,views&period=day&metric_type=total_value&breakdown=media_product_type&since=${s30}&until=${u30}`);
  const sonuc = (d) => Object.fromEntries((d?.total_value?.breakdowns?.[0]?.results || []).map((r) => [r.dimension_values[0], r.value]));
  const f = sonuc(fu[0]);
  hesap = {
    takipci: profil.followers_count ?? null,
    // end_time günün sonunu (TR 11:00) gösterir; değer bir önceki günün yeni takipçisidir.
    yeni: Object.fromEntries(fc[0].values.map((v) => [gunKey(new Date(new Date(v.end_time).getTime() - 86400000)), v.value])),
    takip: f.FOLLOWER ?? null,
    birakma: f.NON_FOLLOWER ?? null,
    erisim: er.map((d) => ({ ad: d.name, toplam: d.total_value?.value, tur: sonuc(d) })),
  };
} catch (e) {
  hesap.uyari = e.message;
}
mkdirSync(CIKTI, { recursive: true });
const GECMIS = join(CIKTI, "gecmis.json");
const gecmis = existsSync(GECMIS) ? JSON.parse(readFileSync(GECMIS, "utf8")) : { yeni_takipci: {} };
Object.assign(gecmis.yeni_takipci, hesap.yeni);
writeFileSync(GECMIS, JSON.stringify(gecmis, null, 1));
const yeniTakipci = gecmis.yeni_takipci;

// ── Reels / Shorts satırları ──
const ig = tumVideo.filter((v) => v.platform === "instagram");
const yt = tumVideo.filter((v) => v.platform === "youtube");
const ytBul = (pid) => yt.find((v) => v.paylasim_id && v.paylasim_id === pid);
const igOnceki = (an) => ortanca(ig.filter((v) => v.yayin_at < an && v.yayin_at >= new Date(new Date(an).getTime() - 90 * 86400000).toISOString()).map((v) => v.metrikler?.views));
const ytOnceki = (an) => ortanca(yt.filter((v) => v.yayin_at < an && v.yayin_at >= new Date(new Date(an).getTime() - 90 * 86400000).toISOString()).map((v) => v.metrikler?.views));

const donem = ig.filter((v) => v.yayin_at >= bas).sort((a, b) => a.yayin_at.localeCompare(b.yayin_at));
const reels = donem.map((v) => {
  const m = v.metrikler || {};
  const p = paylasimlar.find((x) => x.id === v.paylasim_id);
  const y = v.paylasim_id ? ytBul(v.paylasim_id) : null;
  const proje = p ? projeler[p.baslik] : null;
  const sure = y?.sure_sn ?? null;
  const taban = igOnceki(v.yayin_at);
  return {
    an: v.yayin_at,
    baslik: `${p?.baslik || v.baslik}${p?.ig_deneme ? " [deneme]" : ""}`,
    otomatik: !!p,
    olgun: v.yayin_at <= olgun,
    views: m.views,
    erisim: m.erisim,
    kat: taban && m.views != null ? m.views / taban : null,
    ortSure: m.ort_sure_sn,
    sure,
    izlemeOrani: sure && m.ort_sure_sn ? m.ort_sure_sn / sure : null,
    kaydetB: binde(m.kaydet, m.erisim),
    paylasB: binde(m.paylasim, m.erisim),
    begeniB: binde(m.begeni, m.erisim),
    yeniTakipci: yeniTakipci[gunKey(v.yayin_at)] ?? null,
    yt: y
      ? {
          views: y.metrikler?.views,
          kat: ytOnceki(y.yayin_at) && y.metrikler?.views != null ? y.metrikler.views / ytOnceki(y.yayin_at) : null,
          ortYuzde: y.metrikler?.ort_yuzde,
          t3: tutmaSn(y.tutma, y.sure_sn, 3),
          t10: tutmaSn(y.tutma, y.sure_sn, 10),
          kopus: enBuyukKopus(y.tutma, y.sure_sn),
          abone: y.metrikler?.abone,
        }
      : null,
    proje,
  };
});

// ── Rapor ──
const md = [];
const ekle = (...s) => md.push(...s, "");
ekle(`# Paylaşım analizi — ${tr(Date.now(), { day: "2-digit", month: "long", year: "numeric" })}`, `Dönem: son ${GUN} gün. "Kat" = görüntülenmenin, aynı hesabın önceki 90 gündeki ortanca görüntülenmesine oranı (1,0 = sıradan gün, 3+ = gerçekten tuttu). 48 saati dolmamış gönderiler *italik*.`);

// 1) Hesap
ekle("## 1. Hesap (Instagram, son 30 gün)");
if (hesap.uyari) ekle(`> Hesap içgörüleri okunamadı: ${hesap.uyari}`);
else {
  const er = hesap.erisim.find((e) => e.ad === "reach");
  const vw = hesap.erisim.find((e) => e.ad === "views");
  ekle(
    `- Takipçi: **${n(hesap.takipci)}** · 30 günde takip eden **${n(hesap.takip)}**, bırakan **${n(hesap.birakma)}** → net **${n((hesap.takip ?? 0) - (hesap.birakma ?? 0))}**`,
    `- Erişim (tekil hesap) ${n(er?.toplam)} — türe göre: ${Object.entries(er?.tur || {}).filter(([, v]) => v > 10).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${n(v)}`).join(", ")}`,
    `- Görüntülenme ${n(vw?.toplam)} — türe göre: ${Object.entries(vw?.tur || {}).filter(([, v]) => v > 10).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${n(v)}`).join(", ")}`,
  );
  const gunler = Object.keys(yeniTakipci).filter((g) => g >= bas.slice(0, 10)).sort();
  const neCikti = (g) =>
    [
      ...reels.filter((r) => gunKey(r.an) === g).map((r) => `Reels: ${kisalt(r.baslik, 34)}`),
      ...carousel.filter((c) => gunKey(c.yayin_at) === g).map((c) => `Carousel: ${kisalt(c.baslik, 30)}`),
    ].join("; ") || "—";
  ekle("Günlük yeni takipçi ve o gün ne çıktı:", tablo(["Gün", "Yeni takipçi", "O gün çıkan"], gunler.map((g) => [gunAd(`${g}T12:00:00+03:00`), n(yeniTakipci[g]), neCikti(g)])));
  const reelsGunu = gunler.filter((g) => reels.some((r) => gunKey(r.an) === g));
  const bos = gunler.filter((g) => !reelsGunu.includes(g));
  ekle(`Reels çıkan günlerin ortanca yeni takipçisi **${n(ortanca(reelsGunu.map((g) => yeniTakipci[g])))}**, çıkmayan günlerin **${n(ortanca(bos.map((g) => yeniTakipci[g])))}** (${reelsGunu.length}/${bos.length} gün).`);
}

// 2) Reels
ekle("## 2. Reels (Instagram) ve aynı videonun Shorts'u");
ekle(
  tablo(
    ["Gün", "Video", "IG izl.", "Kat", "Ort. izleme", "İzleme oranı", "Kaydet‰", "Paylaş‰", "YT izl.", "YT kat", "YT 3. sn", "YT 10. sn", "YT kopuş"],
    reels.map((r) => {
      const ad = r.olgun ? kisalt(r.baslik) : `*${kisalt(r.baslik)}*`;
      return [
        gunAd(r.an),
        r.otomatik ? ad : `${ad} (elle)`,
        n(r.views),
        n(r.kat, 1),
        r.ortSure != null ? `${n(r.ortSure, 1)} sn${r.sure ? ` / ${r.sure}` : ""}` : "—",
        yuzde(r.izlemeOrani),
        n(r.kaydetB, 1),
        n(r.paylasB, 1),
        n(r.yt?.views),
        n(r.yt?.kat, 1),
        yuzde(r.yt?.t3),
        yuzde(r.yt?.t10),
        r.yt?.kopus?.sn != null ? `${r.yt.kopus.sn}. sn` : "—",
      ];
    }),
  ),
);
const otoOlgun = reels.filter((r) => r.otomatik && r.olgun);
ekle(
  `Otomatik dönemin (48 saati dolmuş ${otoOlgun.length} video) ortancası: IG ${n(ortanca(otoOlgun.map((r) => r.views)))} görüntülenme, ${n(ortanca(otoOlgun.map((r) => r.ortSure)), 1)} sn ortalama izleme, izleme oranı ${yuzde(ortanca(otoOlgun.map((r) => r.izlemeOrani)))}; YT 3. sn tutma ${yuzde(ortanca(otoOlgun.map((r) => r.yt?.t3)))}, 10. sn ${yuzde(ortanca(otoOlgun.map((r) => r.yt?.t10)))}.`,
);

// 3) Kanca ve ses
ekle("## 3. Kanca, ses ve kurgu (proje dosyalarından)");
const kancaSatir = reels.filter((r) => r.proje).map((r) => {
  const p = r.proje;
  const kanca = (p.gorsel?.[0]?.kanca || []).join(" ");
  const efekt = p.efektler || [];
  return {
    r,
    kanca,
    soru: /\?/.test(kanca) || /\?/.test(r.baslik),
    sayi: /\d/.test(kanca),
    efekt: efekt.length,
    ilkEfekt: efekt.filter((e) => e.an <= 1.7).length,
    muzik: (p.muzik?.dosya || "—").replace(/\.mp3$/, ""),
    sahne: (p.gorsel || []).length,
  };
});
ekle(
  tablo(
    ["Video", "Kanca yazısı", "Soru?", "Müzik", "Efekt (ilk 1,7 sn)", "Sahne", "IG kat", "Ort. izleme", "YT 3. sn"],
    kancaSatir.map((k) => [kisalt(k.r.baslik, 34), kisalt(k.kanca, 40) || "—", k.soru ? "evet" : "", k.muzik, `${k.efekt} (${k.ilkEfekt})`, k.sahne, n(k.r.kat, 1), k.r.ortSure != null ? `${n(k.r.ortSure, 1)} sn` : "—", yuzde(k.r.yt?.t3)]),
  ),
);
const grup = (ad, f) => {
  const a = kancaSatir.filter((k) => k.r.olgun && f(k));
  const b = kancaSatir.filter((k) => k.r.olgun && !f(k));
  return `- ${ad}: ${a.length} video ortanca kat ${n(ortanca(a.map((k) => k.r.kat)), 2)}, izleme ${n(ortanca(a.map((k) => k.r.ortSure)), 1)} sn — diğer ${b.length} video ${n(ortanca(b.map((k) => k.r.kat)), 2)}, ${n(ortanca(b.map((k) => k.r.ortSure)), 1)} sn`;
};
ekle(
  "Basit bölmeler (örnek az; yön gösterir, kanıt değildir):",
  grup("Soru kancası", (k) => k.soru),
  grup("Kancada sayı", (k) => k.sayi),
  grup("20+ efekt", (k) => k.efekt >= 20),
);
const muzikler = {};
for (const k of kancaSatir.filter((k) => k.r.olgun)) (muzikler[k.muzik] ||= []).push(k.r.kat);
ekle("Müziğe göre ortanca kat: " + Object.entries(muzikler).map(([m, a]) => `${m} ${n(ortanca(a), 2)} (${a.length})`).join(" · "));

// 4) Saat ve gün
ekle("## 4. Yayın saati ve günü (Instagram Reels, tüm geçmiş)");
const saatGrup = {};
const gunGrup = {};
for (const v of ig) {
  const k = v.metrikler?.views;
  if (k == null) continue;
  const s = saat(v.yayin_at);
  const dilim = s < 9 ? "00–09" : s < 12 ? "09–12" : s < 15 ? "12–15" : s < 18 ? "15–18" : s < 21 ? "18–21" : "21–24";
  (saatGrup[dilim] ||= []).push(k / (igOnceki(v.yayin_at) || k));
  (gunGrup[tr(v.yayin_at, { weekday: "long" })] ||= []).push(k / (igOnceki(v.yayin_at) || k));
}
ekle(
  tablo(["Saat (TR)", "Video", "Ortanca kat"], Object.keys(saatGrup).sort().map((d) => [d, saatGrup[d].length, n(ortanca(saatGrup[d]), 2)])),
  tablo(["Gün", "Video", "Ortanca kat"], Object.entries(gunGrup).map(([g, a]) => [g, a.length, n(ortanca(a), 2)])),
  "Kat kullanıldı çünkü hesabın genel seviyesi yıllar içinde çok değişti (2025 ortası ~5K, 2026 ~1–2K); ham izlenme eski saatleri kayırırdı.",
);

// 5) Hikâyeler
ekle("## 5. Hikâyeler");
const hk = hikayeler.sort((a, b) => a.yayin_at.localeCompare(b.yayin_at)).map((h) => {
  const soz = h.paylasim_id ? null : sozler.find((s) => gunKey(s.yayin_at) === gunKey(h.yayin_at));
  const tur = h.paylasim_id ? "Reels paylaşımı" : h.tur === "IMAGE" ? (soz ? (UST_DUZEN_GUNLERI.includes(gunKey(h.yayin_at)) ? "Söz · yazı üstte" : "Söz · eski düzen") : "Görsel") : "Video";
  return { h, tur, soz: soz?.soz };
});
ekle(
  tablo(
    ["Gün", "Tür", "Söz", "Görüntülenme", "İleri geçen", "Çıkan", "Sonraki hesaba", "Profil ziyareti"],
    hk.map(({ h, tur, soz }) => [
      tr(h.yayin_at, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
      tur,
      kisalt(soz, 40) || "—",
      n(h.goruntuleme),
      h.goruntuleme ? yuzde(h.ileri / h.goruntuleme) : "—",
      h.goruntuleme ? yuzde(h.cikis / h.goruntuleme) : "—",
      h.goruntuleme ? yuzde(h.sonraki_hesap / h.goruntuleme) : "—",
      n(h.profil_ziyaret),
    ]),
  ),
);
for (const t of ["Söz · eski düzen", "Söz · yazı üstte", "Reels paylaşımı"]) {
  const a = hk.filter((x) => x.tur === t).map((x) => x.h);
  if (a.length) md.push(`- ${t}: ${a.length} hikâye, ortanca ${n(ortanca(a.map((h) => h.goruntuleme)))} görüntülenme, ileri geçme ${yuzde(ortanca(a.map((h) => h.ileri / h.goruntuleme)))}, çıkış ${yuzde(ortanca(a.map((h) => h.cikis / h.goruntuleme)))}`);
}
ekle("", `Karşılaştırma: Kasım öncesi söz hikâyeleri (Business Suite, 90 gün) ortanca ~${ESKI_SOZ_HIKAYE_ORTANCA} görüntülenme — o dönem hikâyeler Facebook'a da gidiyordu ve rakama FB dahil olabilir; API ile atılanlar Facebook'a gitmiyor.`);

// 6) Carousel ve Reels
ekle("## 6. Carousel ve Reels (aynı saat, 48 saati dolmuş)");
const carOlgun = carousel.filter((c) => c.ig_metrikler && c.yayin_at <= olgun);
ekle(
  tablo(
    ["Gün", "Carousel", "Görüntülenme", "Erişim", "Kaydet‰", "Paylaş‰"],
    carOlgun.map((c) => [gunAd(c.yayin_at), kisalt(c.baslik), n(c.ig_metrikler.views), n(c.ig_metrikler.erisim), n(binde(c.ig_metrikler.kaydet, c.ig_metrikler.erisim), 1), n(binde(c.ig_metrikler.paylasim, c.ig_metrikler.erisim), 1)]),
  ),
  `Carousel ortanca erişim ${n(ortanca(carOlgun.map((c) => c.ig_metrikler.erisim)))} (${carOlgun.length}) · aynı dönemin otomatik Reels ortanca erişimi ${n(ortanca(otoOlgun.map((r) => r.erisim)))} (${otoOlgun.length}).`,
);

// 7) Veri sınırları
ekle(
  "## 7. Bu raporun göremedikleri",
  "- LinkedIn: gönderi istatistiği okuma izni yok; LinkedIn yorumları elle bakılarak yapılır.",
  "- Instagram Reels için saniye saniye tutma eğrisi yok (yalnız ortalama izleme süresi); kopuş saniyesi YouTube'daki aynı videodan okunuyor.",
  "- Gönderi başına kazandırılan takipçi Reels için API'de yok; günlük yeni takipçi ile o gün çıkan içerik yan yana konuyor (nedensellik değil).",
  "- Hikâye istatistiği yalnız hikâye yayındayken okunabiliyor; sistem öncesi hikâyeler veritabanında yok.",
);

const dosya = join(CIKTI, `paylasim-analizi-${gunKey(Date.now())}.md`);
writeFileSync(dosya, md.join("\n"));
console.log(`✓ ${dosya}`);
