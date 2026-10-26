// Platform içinden temiz ekran görüntüleri — telefonla ekran çekmek yerine.
// Telefon boyutunda (1080 px genişlik) TAM SAYFA görüntü alır; Remotion bunları
// kaydırarak (pan) videoya koyar.
//
// Kullanım: node ekran.mjs public/<proje> [site=http://localhost:3001]
// Gerekli: kök .env.local (Supabase service role + ADMIN_PASSWORD).
// Giriş: e-posta GÖNDERMEDEN sunucuda tek kullanımlık magic-link üretilir ve
// oturum tarayıcıya yazılır (hesap: EKRAN_HESABI).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";

const EKRAN_HESABI = "eser1003@gmail.com";
const [cikti = "ekran", site = "http://localhost:3001"] = process.argv.slice(2);

// Kayıt edilecek sayfalar. gizle: herkese açık videoda görünmemesi gereken
// kişisel veri (yatırımcı adı/e-postası) — bu seçicilerdeki metin bulanıklaşır.
const SAYFALAR = [
  {
    ad: "yatirimcilar",
    yol: "/admin/match",
    bekle: 4000,
    // Boş sağ paneli gizle, listeyi tam boy aç.
    css: `.max-h-\\[70vh\\]{max-height:none!important}.md\\:grid-cols-2>div:nth-child(2){display:none}`,
    gizle: ["button .font-bold.text-sm", "button .text-\\[11px\\]", ".border-orange-500\\/30 .min-w-0"],
  },
  { ad: "panel", yol: "/portal/course", bekle: 4000 },
  // girisim: form, giriş yapan hesabın değil bu (gerçek, onaylı) girişimin kaydıyla gösterilir.
  { ad: "girisim", yol: "/portal/startup", bekle: 4000, girisim: "Creato AI" },
  { ad: "anasayfa", yol: "/", bekle: 2500 },
];

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")])
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const ref = new URL(url).hostname.split(".")[0];

const yonetici = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: link, error: e1 } = await yonetici.auth.admin.generateLink({ type: "magiclink", email: EKRAN_HESABI });
if (e1) throw e1;
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { data: oturum, error: e2 } = await anon.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" });
if (e2) throw e2;

mkdirSync(cikti, { recursive: true });
const tarayici = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await tarayici.newContext({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });
await ctx.addInitScript(
  ([anahtar, deger, pw]) => {
    localStorage.setItem(anahtar, deger);
    localStorage.setItem("ds_sahip", "1"); // okunma sayısını şişirmesin
    localStorage.setItem("ds_phone_prompt_done", "1"); // telefon açılır penceresi çıkmasın
    sessionStorage.setItem("ds_admin_pw", pw);
  },
  [`sb-${ref}-auth-token`, JSON.stringify(oturum.session), env.ADMIN_PASSWORD]
);

const boylar = {};
for (const s of SAYFALAR) {
  const sayfa = await ctx.newPage();
  if (s.girisim) {
    const { data: profil, error } = await yonetici.from("inv_startup_profiles").select("*").eq("startup_name", s.girisim).single();
    if (error) throw error;
    // Yalnız GET yanıtı değişir; veritabanına yazılmaz. "N yatırımcı görüşmek istedi" gösterilmez:
    // mevcut talepler test yatırımcılarından, videoda yanıltıcı olur.
    await sayfa.route("**/api/me/startup", (r) =>
      r.request().method() === "GET"
        ? r.fulfill({ json: { profile: profil, interest: { count: 0, investors: [] } } })
        : r.abort()
    );
  }
  await sayfa.goto(site + s.yol, { waitUntil: "networkidle" });
  await sayfa.waitForTimeout(s.bekle);
  // Panel düzenleri h-screen + iç kaydırma kullanıyor: tam sayfa görüntü için iç kaydırmayı aç.
  await sayfa.addStyleTag({
    content: `.h-screen{height:auto!important;overflow:visible!important} main,main>div{overflow:visible!important}
      nextjs-portal,[data-nextjs-toast]{display:none!important} ${s.css || ""}
      ${s.gizle ? s.gizle.map((g) => `main ${g}`).join(",") + "{filter:blur(6px)}" : ""}`,
  });
  await sayfa.waitForTimeout(500);
  const boy = await sayfa.evaluate(() => document.documentElement.scrollHeight);
  const en = sayfa.viewportSize().width; // yana taşan öğeler kadrajı genişletmesin
  await sayfa.screenshot({ path: `${cikti}/${s.ad}.png`, fullPage: true, clip: { x: 0, y: 0, width: en, height: boy } });
  boylar[s.ad] = Math.round(boy * 2.5); // px (deviceScaleFactor)
  console.log("✓", s.ad);
  await sayfa.close();
}
await tarayici.close();
writeFileSync(`${cikti}/ekran.json`, JSON.stringify(boylar)); // Remotion kaydırma mesafesi için
