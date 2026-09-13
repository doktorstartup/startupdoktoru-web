import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
2. E-Kitap (12 $ yerine 6 $): "13 Adımda Milyon Dolarlık Startup" → /ebook
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
2. Ebook ($6, down from $12): "A Million-Dollar Startup in 13 Steps" → /en/ebook
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

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "placeholder-openai-key") {
      // Elegant fallback when API key is not configured
      if (lang === "en") {
        return NextResponse.json({
          reply: `Good question. Being systematic about your startup process matters more than almost anything else.\n\nWhere I'd start:\n\n1. **Problem validation:** Have 10 conversations with potential customers first. Don't sell — just listen.\n\n2. **Keep the MVP small:** Ship the simplest version that solves one problem. Over-engineering is the most common mistake.\n\n3. **Build a funnel:** Free value → small paid product → big product → advisory. Trust compounds in that order.\n\nFor the full growth strategy, I'd suggest joining [our free training](/en/free-training).`
        });
      }
      return NextResponse.json({
        reply: `Harika bir soru! Startup sürecinizde sistematik bir yaklaşım benimsemek kritik önemde.\n\nBaşlangıç için önerilerim:\n\n1. **Problem Doğrulama:** Önce potansiyel müşterilerinizle 10 görüşme yapın. Ürününüzü satmaya çalışmayın — sadece dinleyin.\n\n2. **MVP'yi küçük tutun:** Tek bir problemi çözen, en basit versiyonu çıkarın. Over-engineering en yaygın hata.\n\n3. **Funnel kurun:** Ücretsiz değer → küçük ücretli ürün → büyük ürün → danışmanlık sıralamasıyla güven inşa edin.\n\nDetaylı büyüme stratejisi için [ücretsiz eğitimimize](/free-training) katılmanızı öneririm.`
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content || "Şu anda yanıt üretemiyorum, lütfen tekrar deneyin.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI API Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "AI servisi geçici olarak kullanılamıyor." },
      { status: 500 }
    );
  }
}
