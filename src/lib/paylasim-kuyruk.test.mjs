// Paylaşım kuyruğu testleri: migration gerçek Postgres'te (PGlite) çalışır, platformlar sahte/yerel sunucu.
// Canlı veritabanına ve platformlara dokunmaz.  Çalıştır: npm run test:paylasim
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { PGlite } from "@electric-sql/pglite";
import { kuyrukAdimi, MAX_DENEME } from "./paylasim-kuyruk.ts";
import { instagramIstemci, shortsMetni, youtubeIstemci } from "./paylasim-platform.ts";

const migration = readFileSync(new URL("../../supabase/migrations/0036_paylasim_kuyrugu.sql", import.meta.url), "utf8");
const tablo = readFileSync(new URL("../../supabase/migrations/0031_paylasim.sql", import.meta.url), "utf8");

async function kur() {
  const db = new PGlite();
  // Supabase'e özgü parçalar için boş kabuk.
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema storage; create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create schema cron; create function cron.schedule(text, text, text) returns int language sql as 'select 1';
    create schema net; create table net.istek (url text, headers jsonb);
    create function net.http_get(url text, headers jsonb, timeout_milliseconds int) returns bigint language sql as 'insert into net.istek values (url, headers); select 1::bigint';
    create schema vault; create table vault.decrypted_secrets (name text, decrypted_secret text);
  `);
  await db.exec(tablo);
  await db.exec(migration.replace(/^create extension.*$/gm, ""));
  return db;
}

const metinler = { shorts: { metin: "BAŞLIK: Deneme\n\nAÇIKLAMA:\nmetin" }, instagram: { metin: "açıklama" } };

async function video(db, ad, ek = {}) {
  const { rows } = await db.query(`insert into ds_paylasim (baslik, durum, video_yol, platformlar) values ($1, 'hazir', $2, $3) returning id`, [
    ad,
    `${ad}/video.mp4`,
    JSON.stringify(ek.platformlar ?? metinler),
  ]);
  return rows[0].id;
}

// Videoyu kuyruğa alıp vadesini geçirir.
async function vadesiGelmis(db, ad, ek) {
  const id = await video(db, ad, ek);
  await db.query(`select paylasim_kuyruga_al($1)`, [id]);
  await db.query(`update ds_paylasim set yayin_at = now() - interval '1 minute' where id = $1`, [id]);
  return id;
}

const satir = async (db, id) => (await db.query(`select * from ds_paylasim where id = $1`, [id])).rows[0];
const kilidiEskit = (db, id, p) =>
  db.query(`update ds_paylasim set yayin = jsonb_set(yayin, array[$2, 'kilit'], to_jsonb(now() - interval '10 minutes')) where id = $1`, [id, p]);

function depo(db) {
  const d = {
    temizlenen: [],
    vadesiGelenler: async () =>
      (await db.query(`select id, baslik, video_yol, ai_icerik, platformlar, yayin_at, yayin from ds_paylasim where yayin_at <= now() and yayin_bitti_at is null order by yayin_at limit 3`)).rows,
    kilitAl: async (id, p, sn) => (await db.query(`select paylasim_kilit_al($1, $2, $3) r`, [id, p, sn])).rows[0].r,
    yama: async (id, p, y, link) => (await db.query(`select paylasim_yama($1, $2, $3, $4) r`, [id, p, JSON.stringify(y), link ?? null])).rows[0].r,
    dosyaTemizle: async (v) => void d.temizlenen.push(v.id),
    kuyruktanCikar: async (id) => void (await db.query(`update ds_paylasim set yayin_at = null, iptal_at = now(), yayin = '{}' where id = $1`, [id])),
  };
  return d;
}

// Platform gibi davranan sahteler: gerçekten kaç video çıktığını sayar.
function sahteYouTube(ayar = {}) {
  const y = {
    oturumlar: {},
    yayinlanan: 0,
    gizlilik: ayar.gizlilik ?? "public",
    async oturumAc() {
      if (ayar.oturumHata) throw new Error(ayar.oturumHata);
      const o = `oturum-${Object.keys(y.oturumlar).length + 1}`;
      y.oturumlar[o] = null;
      return o;
    },
    async gonder(o) {
      if (y.oturumlar[o]) return y.oturumlar[o]; // bitmiş oturum aynı videoyu döner
      if (ayar.yarim && !y.yarimOldu) return (y.yarimOldu = true), null;
      y.oturumlar[o] = `yt-${++y.yayinlanan}`;
      if (ayar.cevapKaybi && !y.kayipOldu) {
        y.kayipOldu = true;
        throw new Error("zaman aşımı");
      }
      return y.oturumlar[o];
    },
    kontrol: async () => ({ gizlilik: y.gizlilik, yukleme: "uploaded" }),
  };
  return y;
}

function sahteInstagram(ayar = {}) {
  const g = {
    containerlar: {},
    yayinlanan: 0,
    durumlar: [...(ayar.durumlar ?? [])],
    async containerAc() {
      const c = `c-${Object.keys(g.containerlar).length + 1}`;
      g.containerlar[c] = "FINISHED";
      return c;
    },
    durum: async (c) => g.durumlar.shift() ?? g.containerlar[c],
    async yayinla(c) {
      assert.notEqual(g.containerlar[c], "PUBLISHED", "aynı container iki kez yayınlandı");
      g.containerlar[c] = "PUBLISHED";
      g.yayinlanan++;
      if (ayar.cevapKaybi && !g.kayipOldu) {
        g.kayipOldu = true;
        throw new Error("zaman aşımı");
      }
      return "ig-1";
    },
    sonMedya: async () => "ig-1",
    permalink: async () => "https://www.instagram.com/reel/KOD/",
  };
  return g;
}

function bagim(db, ayar = {}) {
  const b = { depo: ayar.depo ?? depo(db), youtube: sahteYouTube(ayar.yt), instagram: sahteInstagram(ayar.ig), bildirimler: [] };
  b.bildir = async (konu, metin) => void b.bildirimler.push(`${konu}: ${metin}`);
  return b;
}

test("kuyruğa yerleşme: ardışık boş günler, en az 24 saat sonra, 19:00 TR", async () => {
  const db = await kur();
  const an = [];
  for (const ad of ["a", "b", "c"]) {
    const id = await video(db, ad);
    an.push(new Date((await db.query(`select paylasim_kuyruga_al($1) r`, [id])).rows[0].r));
    const ikinci = (await db.query(`select paylasim_kuyruga_al($1) r`, [id])).rows[0].r;
    assert.equal(new Date(ikinci).getTime(), an.at(-1).getTime(), "tekrar çağrı günü değiştirmemeli");
  }
  assert.ok(an[0].getTime() > Date.now() + 24 * 3600000);
  assert.equal(an[1] - an[0], 86400000);
  assert.equal(an[2] - an[1], 86400000);
  for (const a of an) assert.equal(a.getUTCHours(), 16);
});

test("iptal edilen gün boşalır, sıradaki video oraya girer; hazır olmayan giremez", async () => {
  const db = await kur();
  const a = await video(db, "a");
  const b = await video(db, "b");
  const ilk = (await db.query(`select paylasim_kuyruga_al($1) r`, [a])).rows[0].r;
  await db.query(`select paylasim_kuyruga_al($1)`, [b]);
  assert.equal((await db.query(`select paylasim_iptal($1) r`, [a])).rows[0].r, true);
  const c = await video(db, "c");
  const yeni = (await db.query(`select paylasim_kuyruga_al($1) r`, [c])).rows[0].r;
  assert.equal(new Date(yeni).getTime(), new Date(ilk).getTime());

  const d = await video(db, "d");
  await db.query(`update ds_paylasim set durum = 'kurguda' where id = $1`, [d]);
  await assert.rejects(db.query(`select paylasim_kuyruga_al($1)`, [d]));
});

test("aynı güne iki video yazılamaz", async () => {
  const db = await kur();
  const a = await video(db, "a");
  const b = await video(db, "b");
  await db.query(`select paylasim_kuyruga_al($1)`, [a]);
  await assert.rejects(db.query(`update ds_paylasim set yayin_at = (select yayin_at from ds_paylasim where id = $1) where id = $2`, [a, b]));
});

test("24 saat kuralı: 24 saatten az kala iptal reddedilir", async () => {
  const db = await kur();
  const id = await video(db, "a");
  await db.query(`select paylasim_kuyruga_al($1)`, [id]);
  await db.query(`update ds_paylasim set yayin_at = now() + interval '23 hours 59 minutes' where id = $1`, [id]);
  assert.equal((await db.query(`select paylasim_iptal($1) r`, [id])).rows[0].r, false);
  assert.ok((await satir(db, id)).yayin_at);

  await db.query(`update ds_paylasim set yayin_at = now() + interval '24 hours 1 minute' where id = $1`, [id]);
  assert.equal((await db.query(`select paylasim_iptal($1) r`, [id])).rows[0].r, true);
  const s = await satir(db, id);
  assert.equal(s.yayin_at, null);
  assert.ok(s.iptal_at);
});

test("yayını gelmemiş video tikte işlenmez", async () => {
  const db = await kur();
  const id = await video(db, "a");
  await db.query(`select paylasim_kuyruga_al($1)`, [id]);
  const b = bagim(db);
  assert.equal((await kuyrukAdimi(b)).videolar, 0);
  assert.equal(b.youtube.yayinlanan, 0);
});

test("tam akış: iki platform, linkler işlenir, durum paylaşıldı, dosya temizlenir", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const b = bagim(db);
  await kuyrukAdimi(b); // YT yükler, IG container açar
  await kuyrukAdimi(b); // YT doğrular, IG yayınlar
  const s = await satir(db, id);
  assert.equal(s.durum, "paylasildi");
  assert.equal(s.yayin.shorts.durum, "yayinda");
  assert.equal(s.yayin.instagram.durum, "yayinda");
  assert.equal(s.platformlar.shorts.link, "https://youtube.com/shorts/yt-1");
  assert.equal(s.platformlar.instagram.link, "https://www.instagram.com/reel/KOD/");
  assert.ok(s.platformlar.shorts.paylasildi_at);
  assert.ok(s.yayin_bitti_at);
  assert.deepEqual(b.depo.temizlenen, [id]);
});

test("cron üst üste çalışınca çift paylaşım yok (paralel + ardışık)", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const b = bagim(db);
  await Promise.all([kuyrukAdimi(b), kuyrukAdimi(b), kuyrukAdimi(b)]);
  for (let i = 0; i < 5; i++) await kuyrukAdimi(b);
  assert.equal(b.youtube.yayinlanan, 1);
  assert.equal(Object.keys(b.youtube.oturumlar).length, 1);
  assert.equal(b.instagram.yayinlanan, 1);
  assert.equal((await satir(db, id)).yayin.shorts.id, "yt-1");
});

test("kilit süresi dolmadan ikinci tik platforma giremez", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const d = depo(db);
  assert.ok(await d.kilitAl(id, "shorts", 180));
  assert.equal(await d.kilitAl(id, "shorts", 180), null);
  await kilidiEskit(db, id, "shorts");
  assert.ok(await d.kilitAl(id, "shorts", 180));
});

test("sistem kapalıyken gecikmiş video açılınca yayınlanmaz, kuyruktan çıkar ve bildirilir", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  await db.query(`update ds_paylasim set yayin_at = now() - interval '30 hours' where id = $1`, [id]);
  const yakin = await vadesiGelmis(db, "b");
  await db.query(`update ds_paylasim set yayin_at = now() - interval '5 hours' where id = $1`, [yakin]);
  const b = bagim(db);
  await kuyrukAdimi(b);
  await kuyrukAdimi(b);
  const s = await satir(db, id);
  assert.equal(s.yayin_at, null);
  assert.ok(s.iptal_at);
  assert.equal(b.youtube.yayinlanan, 1, "yalnız 6 saati geçmeyen gider");
  assert.match(b.bildirimler[0], /gecikti/);
});

test("YouTube cevabı kaybolursa aynı oturum sorulur, ikinci video çıkmaz", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const b = bagim(db, { yt: { cevapKaybi: true } });
  await kuyrukAdimi(b);
  let s = await satir(db, id);
  assert.equal(s.yayin.shorts.deneme, 1);
  assert.ok(s.yayin.shorts.oturum, "oturum kayıtlı kalmalı");
  await kuyrukAdimi(b);
  await kuyrukAdimi(b);
  s = await satir(db, id);
  assert.equal(b.youtube.yayinlanan, 1);
  assert.equal(Object.keys(b.youtube.oturumlar).length, 1);
  assert.equal(s.yayin.shorts.durum, "yayinda");
});

test("süre dolan yükleme kaldığı yerden sürer", async () => {
  const db = await kur();
  await vadesiGelmis(db, "a");
  const b = bagim(db, { yt: { yarim: true } });
  await kuyrukAdimi(b);
  assert.equal(b.youtube.yayinlanan, 0);
  await kuyrukAdimi(b);
  assert.equal(b.youtube.yayinlanan, 1);
  assert.equal(Object.keys(b.youtube.oturumlar).length, 1);
});

test("fonksiyon yayından sonra ölürse (veritabanına yazamadı) tekrar yayınlanmaz", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const d = depo(db);
  const gercekYama = d.yama;
  const b = bagim(db, { depo: d });

  await kuyrukAdimi(b); // container açıldı, video yüklendi
  d.yama = async () => {
    throw new Error("veritabanı yok");
  };
  await kuyrukAdimi(b); // IG yayınladı ama durum yazılamadı; kilit asılı kaldı
  assert.equal(b.instagram.yayinlanan, 1);
  assert.equal((await satir(db, id)).yayin.instagram.durum, "isleniyor");

  d.yama = gercekYama;
  await kuyrukAdimi(b); // kilit dolu: dokunulmaz
  assert.equal((await satir(db, id)).yayin.instagram.durum, "isleniyor");

  await kilidiEskit(db, id, "instagram");
  await kuyrukAdimi(b);
  const s = await satir(db, id);
  assert.equal(b.instagram.yayinlanan, 1);
  assert.equal(s.yayin.instagram.durum, "yayinda");
  assert.equal(s.yayin.instagram.id, "ig-1");
});

test("Instagram yayın cevabı kaybolursa PUBLISHED görülür, yeniden yayınlanmaz", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const b = bagim(db, { ig: { cevapKaybi: true } });
  for (let i = 0; i < 3; i++) await kuyrukAdimi(b);
  assert.equal(b.instagram.yayinlanan, 1);
  assert.equal((await satir(db, id)).yayin.instagram.durum, "yayinda");
});

test("Instagram işlerken beklenir; ERROR'da yeni container açılır", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const b = bagim(db, { ig: { durumlar: ["IN_PROGRESS", "ERROR"] } });
  await kuyrukAdimi(b); // container
  await kuyrukAdimi(b); // IN_PROGRESS
  assert.equal((await satir(db, id)).yayin.instagram.container, "c-1");
  await kuyrukAdimi(b); // ERROR → container düşer
  assert.equal((await satir(db, id)).yayin.instagram.container, null);
  await kuyrukAdimi(b); // yeni container
  assert.equal((await satir(db, id)).yayin.instagram.container, "c-2");
  await kuyrukAdimi(b);
  assert.equal(b.instagram.yayinlanan, 1);
});

test("tek platform hatası diğerini engellemez, sessiz kalmaz, dosya silinmez", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const b = bagim(db, { yt: { oturumHata: "yetersiz kapsam" } });
  for (let i = 0; i < MAX_DENEME + 2; i++) await kuyrukAdimi(b);
  const s = await satir(db, id);
  assert.equal(s.yayin.instagram.durum, "yayinda");
  assert.equal(s.yayin.shorts.durum, "hata");
  assert.equal(s.yayin.shorts.hata, "yetersiz kapsam");
  assert.equal(s.yayin.shorts.deneme, MAX_DENEME);
  assert.ok(s.yayin_bitti_at);
  assert.equal(s.durum, "hazir");
  assert.equal(b.bildirimler.length, 1, "kalıcı hata tek mail");
  assert.match(b.bildirimler[0], /YouTube Shorts: yetersiz kapsam/);
  assert.deepEqual(b.depo.temizlenen, []);
});

test("YouTube private bırakırsa kilitli işaretlenir, yeniden yüklenmez, bildirilir", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a");
  const b = bagim(db, { yt: { gizlilik: "private" } });
  for (let i = 0; i < 4; i++) await kuyrukAdimi(b);
  const s = await satir(db, id);
  assert.equal(s.yayin.shorts.durum, "kilitli");
  assert.equal(b.youtube.yayinlanan, 1);
  assert.equal(b.bildirimler.length, 1);
});

test("elle paylaşılmış platform atlanır", async () => {
  const db = await kur();
  const platformlar = { ...metinler, shorts: { ...metinler.shorts, paylasildi_at: "2026-11-01T10:00:00Z" } };
  const id = await vadesiGelmis(db, "a", { platformlar });
  const b = bagim(db);
  await kuyrukAdimi(b);
  await kuyrukAdimi(b);
  const s = await satir(db, id);
  assert.equal(s.yayin.shorts.durum, "atlandi");
  assert.equal(b.youtube.yayinlanan, 0);
  assert.equal(s.durum, "paylasildi");
});

test("metni boş platform yayınlanmaz, hataya düşer", async () => {
  const db = await kur();
  const id = await vadesiGelmis(db, "a", { platformlar: { shorts: metinler.shorts } });
  const b = bagim(db);
  await kuyrukAdimi(b);
  assert.equal((await satir(db, id)).yayin.instagram.durum, "hata");
  assert.equal(b.bildirimler.length, 1);
});

test("pg_cron tetiği yalnız iş varken ve anahtarla çağırır", async () => {
  const db = await kur();
  const istek = async () => (await db.query(`select * from net.istek`)).rows;
  await db.query(`select paylasim_tetikle()`);
  assert.equal((await istek()).length, 0);
  await vadesiGelmis(db, "a");
  await db.query(`select paylasim_tetikle()`);
  assert.equal((await istek()).length, 0, "Vault anahtarı yokken istek gitmez");
  await db.query(`insert into vault.decrypted_secrets values ('paylasim_cron_secret', 'gizli')`);
  await db.query(`select paylasim_tetikle()`);
  const r = await istek();
  assert.equal(r.length, 1);
  assert.equal(r[0].headers.Authorization, "Bearer gizli");
});

test("shortsMetni kalıbı ayrıştırır", () => {
  assert.deepEqual(shortsMetni("BAŞLIK: Yatırımcılar hazır #shorts\n\nAÇIKLAMA:\nSatır 1\nSatır 2", "x"), { baslik: "Yatırımcılar hazır #shorts", aciklama: "Satır 1\nSatır 2" });
  assert.deepEqual(shortsMetni("düz metin", "Yedek"), { baslik: "Yedek", aciklama: "düz metin" });
});

// YouTube devam ettirilebilir yükleme protokolü: gerçek HTTP ile (yerel sunucu).
function yerelSunucu(isle) {
  return new Promise((coz) => {
    const s = createServer(async (req, res) => {
      const parca = [];
      for await (const c of req) parca.push(c);
      isle(req, res, Buffer.concat(parca));
    });
    s.listen(0, "127.0.0.1", () => coz({ s, url: `http://127.0.0.1:${s.address().port}` }));
  });
}

const dosya = Buffer.from("0123456789");
const istemci = (url) =>
  youtubeIstemci(async () => "tok", () => `${url}/dosya`, { upload: `${url}/upload`, data: `${url}/data` });
const dosyaSun = (req, res) => {
  const bas = Number(req.headers.range?.match(/bytes=(\d+)-/)?.[1] ?? 0);
  res.writeHead(req.headers.range ? 206 : 200, { "content-length": dosya.length - bas });
  res.end(req.method === "HEAD" ? undefined : dosya.subarray(bas));
};
const v = { id: "1", baslik: "b", video_yol: "a/video.mp4", ai_icerik: true, platformlar: metinler };

test("gerçek HTTP: yarım yükleme Range'den sürer, tüm dosya yeniden gitmez", async () => {
  const alinan = [];
  const { s, url } = await yerelSunucu((req, res, govde) => {
    if (req.url === "/dosya") return dosyaSun(req, res);
    if (req.headers["content-range"] === "bytes */10") return res.writeHead(308, { range: "bytes=0-3" }).end();
    alinan.push([req.headers["content-range"], govde.toString()]);
    res.writeHead(201, { "content-type": "application/json" }).end(JSON.stringify({ id: "vid" }));
  });
  assert.equal(await istemci(url).gonder(`${url}/oturum`, v), "vid");
  assert.deepEqual(alinan, [["bytes 4-9/10", "456789"]]);
  s.close();
});

test("gerçek HTTP: bitmiş oturum sorgusu video id'sini döner, bayt gitmez", async () => {
  let put = 0;
  const { s, url } = await yerelSunucu((req, res) => {
    if (req.url === "/dosya") return dosyaSun(req, res);
    put++;
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ id: "vid" }));
  });
  assert.equal(await istemci(url).gonder(`${url}/oturum`, v), "vid");
  assert.equal(put, 1, "yalnız durum sorgusu");
  s.close();
});

test("gerçek HTTP: düşen oturum kalıcı hata olur, oturum silinir", async () => {
  const { s, url } = await yerelSunucu((req, res) => {
    if (req.url === "/dosya") return dosyaSun(req, res);
    res.writeHead(404).end();
  });
  await assert.rejects(istemci(url).gonder(`${url}/oturum`, v), (e) => e.kalici === true && e.yama.oturum === null);
  s.close();
});

test("gerçek HTTP: oturum isteği meta veriyi taşır (AI beyanı dahil)", async () => {
  let govde;
  const { s, url } = await yerelSunucu((req, res, g) => {
    govde = JSON.parse(g.toString());
    res.writeHead(200, { location: `${url}/oturum-1` }).end();
  });
  assert.equal(await istemci(url).oturumAc(v), `${url}/oturum-1`);
  assert.equal(govde.snippet.title, "Deneme");
  assert.equal(govde.status.privacyStatus, "public");
  assert.equal(govde.status.containsSyntheticMedia, true);
  assert.equal(govde.status.selfDeclaredMadeForKids, false);
  s.close();
});

test("gerçek HTTP: Instagram anahtarı URL'de ve hata metninde görünmez", async () => {
  const urller = [];
  const { s, url } = await yerelSunucu((req, res) => {
    urller.push(req.url);
    res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: { message: "reddedildi" } }));
  });
  const ig = instagramIstemci("hesap", "GIZLI", (y) => `https://x/${y}`, url);
  await assert.rejects(ig.durum("c1"), (e) => e.message === "Instagram: reddedildi");
  await assert.rejects(ig.containerAc(v), (e) => !e.message.includes("GIZLI"));
  assert.ok(urller.every((u) => !u.includes("GIZLI")));
  s.close();
});
