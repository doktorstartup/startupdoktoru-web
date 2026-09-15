import { supabaseAdmin } from "./supabase";
import { notifyAdmin } from "./email";

// ÇOK SAĞLAYICILI LLM ZİNCİRİ.
//
// Tek sağlayıcıya bağlıydık; OpenAI kredisi bitince AI mentör sessizce öldü ve
// ziyaretçiye hazır metin gösterilip cevap veriliyormuş gibi yapıldı. Artık:
//   1. Sıradaki sağlayıcı denenir (anahtarı olan ilk sağlayıcıdan başlayarak),
//   2. Her deneme ds_llm_saglik'e yazılır (bekçi buradan uyarır),
//   3. Kota/bakiye bitti sinyali (402/429) gelirse hemen mail gider,
//   4. Hepsi düşerse çağıran taraf HATA alır — sahte cevap üretilmez.
//
// Zincirdeki sıra ücretten ucuza doğru: ücretsiz katmanlar önce.
// Aynı şirketin ikinci anahtarı yedeklilik değildir; kota o hesapta biter.

export type LlmSonuc = { metin: string; saglayici: string };

type Saglayici = {
  ad: string;
  anahtar: () => string | undefined;
  // Neden atlandığını söyleyebilmek için: anahtar var ama yapılandırma eksikse.
  eksik?: () => string | null;
  cagir: (istem: Istem, anahtar: string) => Promise<string>;
};

export type Istem = {
  sistem?: string;
  mesajlar: { role: "user" | "assistant"; content: string }[];
  json?: boolean; // model JSON nesnesi döndürsün
  maxToken?: number;
};

const ZAMAN_ASIMI = 60_000;

// OpenAI uyumlu uç (Kimi/Moonshot, Groq, OpenRouter, OpenAI — hepsi aynı şekil).
async function openAiUyumlu(
  taban: string,
  model: string,
  istem: Istem,
  anahtar: string
): Promise<string> {
  const mesajlar = istem.sistem
    ? [{ role: "system", content: istem.sistem }, ...istem.mesajlar]
    : istem.mesajlar;

  const r = await fetch(`${taban.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${anahtar}` },
    body: JSON.stringify({
      model,
      messages: mesajlar,
      temperature: 0.3,
      max_tokens: istem.maxToken ?? 1500,
      ...(istem.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(ZAMAN_ASIMI),
  });
  if (!r.ok) throw yeniHata(r.status, await r.text());
  const d = await r.json();
  return d.choices?.[0]?.message?.content ?? "";
}

class LlmHatasi extends Error {
  kod: number;
  constructor(kod: number, mesaj: string) {
    super(mesaj);
    this.kod = kod;
  }
}

function yeniHata(kod: number, govde: string) {
  return new LlmHatasi(kod, `HTTP ${kod}: ${govde.slice(0, 200)}`);
}

// Kota/bakiye bitti mi? 402 ödeme gerekli, 429 kota/hız sınırı.
const kotaHatasiMi = (kod: number) => kod === 402 || kod === 429;

const SAGLAYICILAR: Saglayici[] = [
  {
    // Ücretsiz katman — zincirin ilk halkası.
    ad: "gemini",
    anahtar: () => process.env.GEMINI_API_KEY,
    async cagir(istem, anahtar) {
      const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
      // Gemini'de sistem talimatı ayrı alanda; sohbet geçmişi role'süz parçalara çevrilir.
      const contents = istem.mesajlar.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${anahtar}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents,
            ...(istem.sistem ? { systemInstruction: { parts: [{ text: istem.sistem }] } } : {}),
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: istem.maxToken ?? 1500,
              ...(istem.json ? { responseMimeType: "application/json" } : {}),
            },
          }),
          signal: AbortSignal.timeout(ZAMAN_ASIMI),
        }
      );
      if (!r.ok) throw yeniHata(r.status, await r.text());
      const d = await r.json();
      return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },
  },
  {
    // Kimi (Moonshot) — OpenAI uyumlu. Model adı TAHMİN EDİLMEZ: KIMI_MODEL
    // verilmezse sağlayıcı atlanır ve sebebi sağlık tablosuna yazılır.
    ad: "kimi",
    anahtar: () => process.env.KIMI_API_KEY,
    eksik: () => (process.env.KIMI_MODEL ? null : "KIMI_MODEL tanımlı değil"),
    cagir: (istem, anahtar) =>
      openAiUyumlu(
        process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1",
        process.env.KIMI_MODEL!,
        istem,
        anahtar
      ),
  },
  {
    // Son çare — ücretli.
    ad: "openai",
    anahtar: () => {
      const k = process.env.OPENAI_API_KEY;
      return k && k !== "placeholder-openai-key" ? k : undefined;
    },
    cagir: (istem, anahtar) =>
      openAiUyumlu(
        process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        process.env.OPENAI_MODEL || "gpt-4o",
        istem,
        anahtar
      ),
  },
];

async function basariYaz(ad: string) {
  await supabaseAdmin
    .from("ds_llm_saglik")
    .upsert(
      { saglayici: ad, son_basari: new Date().toISOString(), kota_bitti: false, son_hata: null, son_hata_kod: null },
      { onConflict: "saglayici" }
    );
}

async function hataYaz(ad: string, kod: number, mesaj: string) {
  const kota = kotaHatasiMi(kod);
  const { data: onceki } = await supabaseAdmin
    .from("ds_llm_saglik")
    .select("son_bildirim")
    .eq("saglayici", ad)
    .maybeSingle();

  await supabaseAdmin.from("ds_llm_saglik").upsert(
    {
      saglayici: ad,
      son_hata: mesaj.slice(0, 500),
      son_hata_kod: kod,
      son_hata_at: new Date().toISOString(),
      kota_bitti: kota,
    },
    { onConflict: "saglayici" }
  );

  // Kota/bakiye bitti → hemen haber ver ki bakiye yüklenebilsin.
  // Günde bir kez: aynı sorun için uyarı yağmuru olmasın.
  if (!kota) return;
  const son = onceki?.son_bildirim ? new Date(onceki.son_bildirim).getTime() : 0;
  if (Date.now() - son < 24 * 3600000) return;

  await supabaseAdmin
    .from("ds_llm_saglik")
    .update({ son_bildirim: new Date().toISOString() })
    .eq("saglayici", ad);

  await notifyAdmin(
    `${ad.toUpperCase()} kotası bitti — bakiye yükle`,
    `<p><strong>${ad}</strong> sağlayıcısı <code>HTTP ${kod}</code> döndürdü: kota ya da bakiye bitmiş görünüyor.</p>
     <p>Zincir bir sonraki sağlayıcıya düştü, site çalışmaya devam ediyor. Ama yedeği de biterse
     AI mentör ve blog çevirisi durur.</p>
     <p style="color:#64748b;font-size:13px">${mesaj.slice(0, 300)}</p>`
  );
}

// Zinciri sırayla dener. Hepsi düşerse HATA fırlatır — sahte cevap üretmez.
export async function llmUret(istem: Istem): Promise<LlmSonuc> {
  const hatalar: string[] = [];
  let denenen = 0;

  for (const s of SAGLAYICILAR) {
    const anahtar = s.anahtar();
    if (!anahtar) continue;

    const eksik = s.eksik?.();
    if (eksik) {
      hatalar.push(`${s.ad}: ${eksik}`);
      await hataYaz(s.ad, 0, eksik).catch(() => {});
      continue;
    }

    denenen += 1;
    try {
      const metin = await s.cagir(istem, anahtar);
      if (!metin.trim()) throw new LlmHatasi(0, "boş yanıt");
      await basariYaz(s.ad).catch(() => {});
      return { metin, saglayici: s.ad };
    } catch (e) {
      const kod = e instanceof LlmHatasi ? e.kod : 0;
      const mesaj = e instanceof Error ? e.message : String(e);
      hatalar.push(`${s.ad}: ${mesaj}`);
      await hataYaz(s.ad, kod, mesaj).catch(() => {});
    }
  }

  throw new Error(
    denenen === 0
      ? `Hiçbir LLM sağlayıcısı yapılandırılmamış. ${hatalar.join(" | ") || "anahtar yok"}`
      : `Tüm LLM sağlayıcıları başarısız — ${hatalar.join(" | ")}`
  );
}

// Yapılandırılmış sağlayıcı var mı (özellik gizlemek için).
export function llmHazirMi(): boolean {
  return SAGLAYICILAR.some((s) => s.anahtar() && !s.eksik?.());
}
