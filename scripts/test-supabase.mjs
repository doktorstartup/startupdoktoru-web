// .env.local'daki Supabase anahtarlarının çalıştığını doğrular.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim();

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const anon = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const service = get("SUPABASE_SERVICE_ROLE_KEY");

console.log("URL:", url);

// 1) anon (publishable) — public read ds_products
const anonClient = createClient(url, anon);
const r1 = await anonClient.from("ds_products").select("id, price").order("id");
console.log("anon → ds_products:", r1.error ? "HATA: " + r1.error.message : JSON.stringify(r1.data));

// 2) service_role (secret) — RLS bypass, ds_leads okuyabilmeli
const svcClient = createClient(url, service, { auth: { persistSession: false } });
const r2 = await svcClient.from("ds_leads").select("id", { count: "exact", head: true });
console.log("service_role → ds_leads erişimi:", r2.error ? "HATA: " + r2.error.message : `OK (kayıt sayısı: ${r2.count})`);
