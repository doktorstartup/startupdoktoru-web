// YouTube SALT-OKUMA yetkisi al → YOUTUBE_REFRESH_TOKEN'ı .env.local'a yazar.
// Önce .env.local'a YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET (Google Cloud → OAuth istemcisi, tür: Masaüstü uygulaması).
// Kullanım: node scripts/sosyal/youtube-yetki.mjs
// Tarayıcıda "Startupdoktoru" hesabıyla giriş yap ve kanalı seç (kişisel hesap DEĞİL).
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { exec } from "node:child_process";

const ENV = new URL("../../.env.local", import.meta.url);
let env = readFileSync(ENV, "utf8");
const oku = (k) => env.match(new RegExp(`^${k}=(.+)$`, "m"))?.[1].trim();
const clientId = oku("YOUTUBE_CLIENT_ID");
const clientSecret = oku("YOUTUBE_CLIENT_SECRET");
if (!clientId || !clientSecret) {
  console.error("HATA: .env.local içinde YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET yok.");
  process.exit(1);
}

const PORT = 53682;
const redirect = `http://127.0.0.1:${PORT}`;
const url =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
  });

const sunucu = createServer(async (req, res) => {
  const code = new URL(req.url, redirect).searchParams.get("code");
  if (!code) return res.end("Kod yok.");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect, grant_type: "authorization_code" }),
  });
  const d = await r.json();
  if (!d.refresh_token) {
    res.end("Hata — terminale bak.");
    console.error("HATA:", d);
    process.exit(1);
  }
  env = /^YOUTUBE_REFRESH_TOKEN=/m.test(env)
    ? env.replace(/^YOUTUBE_REFRESH_TOKEN=.*$/m, `YOUTUBE_REFRESH_TOKEN=${d.refresh_token}`)
    : `${env.trimEnd()}\nYOUTUBE_REFRESH_TOKEN=${d.refresh_token}\n`;
  writeFileSync(ENV, env);

  // Doğru kanal mı? Adını göster.
  const k = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${d.access_token}` },
  }).then((x) => x.json());
  const ad = k.items?.[0]?.snippet?.title || "(kanal bulunamadı)";
  res.end(`Tamam — kanal: ${ad}. Bu sekmeyi kapatabilirsin.`);
  console.log(`✓ Yetki alındı. Kanal: ${ad}`);
  console.log("✓ YOUTUBE_REFRESH_TOKEN .env.local'a yazıldı. Vercel'e de ekle (Production).");
  sunucu.close();
});

sunucu.listen(PORT, "127.0.0.1", () => {
  console.log("Tarayıcı açılıyor… Startupdoktoru hesabıyla giriş yap.");
  exec(`open "${url}"`);
});
