import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `Sen Startup Doktoru'nun yapay zeka mentör asistanısın. Eser Memişoğlu'nun 10+ yıllık startup, inovasyon ve yatırımcı ilişkileri tecrübesiyle beslenen bir mentörsün.

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Geçersiz mesaj formatı." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "placeholder-openai-key") {
      // Elegant fallback when API key is not configured
      return NextResponse.json({
        reply: `Harika bir soru! Startup sürecinizde sistematik bir yaklaşım benimsemek kritik önemde.\n\nBaşlangıç için önerilerim:\n\n1. **Problem Doğrulama:** Önce potansiyel müşterilerinizle 10 görüşme yapın. Ürününüzü satmaya çalışmayın — sadece dinleyin.\n\n2. **MVP'yi küçük tutun:** Tek bir problemi çözen, en basit versiyonu çıkarın. Over-engineering en yaygın hata.\n\n3. **Funnel kurun:** Ücretsiz değer → küçük ücretli ürün → büyük ürün → danışmanlık sıralamasıyla güven inşa edin.\n\nDetaylı büyüme stratejisi için [ücretsiz eğitimimize](/free-training) katılmanızı öneririm.`
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
