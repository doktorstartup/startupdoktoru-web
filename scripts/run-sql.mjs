// Supabase Postgres'e doğrudan bağlanıp bir .sql dosyasını çalıştırır.
// Bağlantı dizgisini .env.local içindeki SUPABASE_DB_URL satırından okur.
// Kullanım: node scripts/run-sql.mjs supabase/schema.sql
import { readFileSync } from "node:fs";
import pg from "pg";

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("Kullanım: node scripts/run-sql.mjs <dosya.sql>");
  process.exit(1);
}

// .env.local'dan SUPABASE_DB_URL'i ayıkla
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const match = env.match(/^SUPABASE_DB_URL=(.+)$/m);
if (!match) {
  console.error("HATA: .env.local içinde SUPABASE_DB_URL bulunamadı.");
  process.exit(1);
}
const connectionString = match[1].trim();
const sql = readFileSync(new URL(`../${sqlPath}`, import.meta.url), "utf8");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ ${sqlPath} başarıyla çalıştırıldı.`);
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_name like 'ds_%' order by table_name"
  );
  console.log("Oluşan tablolar:", rows.map((r) => r.table_name).join(", "));
  const { rows: products } = await client.query(
    "select id, price, currency from public.ds_products order by id"
  );
  console.log("Ürünler:", JSON.stringify(products));
} catch (err) {
  console.error("HATA:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
