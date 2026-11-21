// Sıradaki söz hikâyelerine LinkedIn metnini işler (onaydan sonra). Gönderi saati: hikâyeden 90 dk sonra (08:30 TR).
// Dosya biçimi: her bölüm "<!-- id: <kuyruk id> -->" satırıyla başlar, sonraki "---" satırına kadar metindir.
// Kullanım: node scripts/hikaye/linkedin-metin.mjs ~/Desktop/hikaye-ornekleri/linkedin-metinleri.md
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const FARK_DK = 90;
const env = Object.fromEntries(
  readFileSync(join(KOK, "../../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const bolumler = [...readFileSync(process.argv[2], "utf8").matchAll(/<!-- id: ([0-9a-f-]{36}) -->\n([\s\S]*?)(?=\n---\n|$)/g)];
for (const [, id, metin] of bolumler) {
  const { data, error } = await db.from("ds_hikaye_kuyruk").select("yayin_at, linkedin_durum, soz").eq("id", id).single();
  if (error) { console.error(id, error.message); continue; }
  if (data.linkedin_durum) { console.log(`atlandı (${data.linkedin_durum}): ${data.soz.slice(0, 50)}`); continue; }
  const linkedin_at = new Date(new Date(data.yayin_at).getTime() + FARK_DK * 60000).toISOString();
  const { error: e } = await db.from("ds_hikaye_kuyruk").update({ linkedin_metin: metin.trim(), linkedin_at }).eq("id", id);
  console.log(e ? `HATA ${id}: ${e.message}` : `✓ ${new Date(linkedin_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} — ${data.soz.slice(0, 50)}`);
}
