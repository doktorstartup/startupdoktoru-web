# Yatırımcı Outreach Kampanyası — Startup Doktoru Platform Daveti

**Amaç:** Tier-1 (~800) yatırımcıyı Startup Doktoru platformuna davet etmek. İlgilenen → otomatik profil.
**Gönderen:** Eser Memişoğlu · Startup Doktoru
**Hero örnek:** Creato AI (gelir üreten, 246 mağaza, güçlü MRR, ilk tur + net exit planı).
**Kademe planı:** tier-1 (800) önce → sonra 2. ve 3. kademe.
**Tempo:** günde 50 mail. Her mailde opt-out (KVKK). Yalnız yayınlanmış/iş adreslerine.

## Değişkenler
`{{first_name}}` · `{{firm_name}}` · `{{interest_link}}` (ilgi/profil CTA) · `{{unsubscribe_link}}`

---

## EN — birincil (global yatırımcılar)

**Subject A:** An invitation: pre-vetted, investor-ready Turkish startups
**Subject B:** Turkish dealflow, already filtered — starting with a revenue-generating AI startup

Hi {{first_name}},

I run Startup Doktoru — a Turkish startup ecosystem where founders go through an intensive preparation program (talks, events, hands-on readiness) *before* they ever reach an investor. The result: you only meet startups with a genuinely high probability of success, not raw dealflow.

One example currently inside: **Creato AI** — an autonomous marketing decision engine for e-commerce brands. It's already revenue-generating (246 connected stores, strong monthly recurring revenue, ₺7M+ of customer revenue recovered in the last 30 days), built by a seasoned team, and opening its first round with a clear path to exit.

Turkey's startup ecosystem is growing fast, with low entry valuations — meaning outsized multiples for early investors with global ambition. Creato is one of several such companies inside; more graduate the program continuously.

If curated, investor-ready Turkish dealflow is interesting to you, I'd love to add you to the platform. Reply **"interested"** or take 15 minutes here: {{interest_link}}

Best,
Eser Memişoğlu — Startup Doktoru

*Not investment advice. If you'd rather not hear from us, opt out here: {{unsubscribe_link}}*

---

## TR — Türk yatırımcılar

**Konu A:** Davet: elenmiş, yatırıma hazır Türk girişimleri
**Konu B:** Türk dealflow'u — zaten filtrelenmiş, gelir üreten bir AI girişimiyle başlıyoruz

Merhaba {{first_name}},

Startup Doktoru'nu yönetiyorum — girişimcilerin yatırımcıyla tanışmadan *önce* yoğun bir hazırlık programından (eğitimler, etkinlikler, birebir hazırlık) geçtiği bir ekosistem. Sonuç: ham dealflow değil, yalnızca başarı ihtimali gerçekten yüksek girişimlerle görüşürsünüz.

Şu an içeride bir örnek: **Creato AI** — e-ticaret markaları için otonom pazarlama karar motoru. Halihazırda gelir üretiyor (246 bağlı mağaza, güçlü aylık yinelenen gelir, son 30 günde ₺7M+ geri kazanılan müşteri geliri), deneyimli bir ekip tarafından kuruldu ve net bir çıkış planıyla ilk turuna çıkıyor.

Türkiye girişim ekosistemi hızla büyüyor ve giriş değerlemeleri düşük — bu da global hedefli erken yatırımcı için yüksek getiri katları demek. Creato içeridekilerden yalnızca biri; programdan sürekli yenileri mezun oluyor.

Elenmiş, yatırıma hazır Türk dealflow'u ilginizi çekiyorsa sizi platforma eklemek isterim. **"İlgileniyorum"** diye yanıtlayın ya da 15 dakika ayırın: {{interest_link}}

Saygılarımla,
Eser Memişoğlu — Startup Doktoru

*Yatırım tavsiyesi değildir. Bizden e-posta almak istemezseniz buradan çıkabilirsiniz: {{unsubscribe_link}}*

---

## İlgi → otomatik profil akışı (kurulacak)
1. Mail gider (50/gün, drip). Açılma/tıklama/yanıt izlenir.
2. Yatırımcı `{{interest_link}}`'e tıklar VEYA "ilgileniyorum" diye yanıtlar.
3. Sistem: inv_outreach.status → `replied`/`interested`; ilgili inv_investors kaydı işaretlenir + otomatik profil oluşturulur/zenginleştirilir; ekibe bildirim.
4. Admin ilgilenen yatırımcıları ayrı görür (pipeline).
