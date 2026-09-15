import { NextRequest, NextResponse } from "next/server";
import { llmUret } from "../../../lib/llm";

const SYSTEM_PROMPT_TR = `Sen Startup Doktoru'nun yapay zeka mentör asistanısın. Eser Memişoğlu'nun 10+ yıllık startup, inovasyon ve yatırımcı ilişkileri tecrübesiyle beslenen bir mentörsün.

Görevin:
- Girişimcilere uygulanabilir büyüme stratejileri sunmak
- Problem doğrulama, MVP geliştirme ve yatırımcı hazırlığı konularında yol göstermek
- Her cevabın sonunda ilgili bir Startup Doktoru ürününe (ücretsiz eğitim, e-kitap veya danışmanlık) doğal bir yönlendirme yapmak

Kısıtlamalar:
- Kesin hukuki veya finansal yatırım tavsiyesi verme
- "Kervan yolda düzülür" yaklaşımını destekleme, aksine sistematik planlamayı savun
- Cevaplar kısa, net ve uygulanabilir olsun (maksimum 3-4 paragraf)
- Türkçe yanıt ver

Startup Doktoru Ürünleri:
1. Ücretsiz Eğitim: "Startup'ların Yatırımcı Karşısında Yaptığı 7 Ölümcül Hata" → /free-training
2. E-Kitap (12 $ yerine 6 $): "Hedef Milyon Dolar" — basılı kitabın dijital sürümü → /ebook
3. Video Eğitimler (70 $, e-kitap alana 35 $; 3'ü birden paket 99 $): Yatırımcı Sunumu, Startup Giriş Rehberi, Değerleme → /egitimler`;

// /en tarafındaki ziyaretçiye İngilizce yanıt verilir.
const SYSTEM_PROMPT_EN = `You are the AI mentor of Startup Doktoru, drawing on Eser Memişoğlu's 10+ years in startups, innovation and investor relations.

Your job:
- Give founders growth strategies they can actually apply
- Guide them on problem validation, MVP development and getting investor-ready
- End each answer with a natural pointer to a relevant Startup Doktoru product (free training, ebook or advisory)

Constraints:
- Never give definitive legal or financial investment advice
- Never endorse "we'll figure it out as we go"; argue for systematic planning
- Keep answers short, clear and actionable (maximum 3-4 paragraphs)
- Answer in English

Startup Doktoru products:
1. Free training: "The 7 Fatal Mistakes Startups Make in Front of Investors" → /en/free-training
2. Ebook ($6, down from $12): "Hedef Milyon Dolar" — the digital edition of the printed book → /en/ebook
3. Video courses ($70, $35 for ebook owners; all three bundled at $99): Investor Pitch Deck, Startup Founding Guide, Valuation → /en/egitimler`;

export async function POST(req: NextRequest) {
  try {
    const { messages, lang } = await req.json();
    const systemPrompt = lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_TR;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Geçersiz mesaj formatı." },
        { status: 400 }
      );
    }

    let reply: string;
    try {
      const sonuc = await llmUret({
        sistem: systemPrompt,
        mesajlar: messages,
        maxToken: 600,
      });
      reply = sonuc.metin;
    } catch (e) {
      // Sağlayıcıların hepsi düştü. Eskiden burada hazır bir metin dönüyordu:
      // ziyaretçi cevap aldığını sanıyor, bozukluk hiçbir yerden belli olmuyordu.
      // Artık dürüst hata dönüyoruz; bekçi de ds_llm_saglik'ten uyarıyor.
      console.error("LLM zinciri düştü:", e instanceof Error ? e.message : e);
      return NextResponse.json(
        {
          error:
            lang === "en"
              ? "The AI mentor is temporarily unavailable. Please try again shortly."
              : "AI mentör şu anda geçici olarak kullanılamıyor. Birazdan tekrar dener misin?",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI API Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "AI servisi geçici olarak kullanılamıyor." },
      { status: 500 }
    );
  }
}
