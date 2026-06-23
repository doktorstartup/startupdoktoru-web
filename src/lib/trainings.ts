// Eğitim kataloğu — tek kaynak. /egitimler, thank-you, ana sayfa ve portal buradan beslenir.
// Fiyat: her eğitim $70; e-kitap alana EBOOK50 ile %50 → $35. 3 eğitim paketi $99.
// Videolar Bunny.net Stream'de (GUID). previewVideo: herkese açık tanıtım (boşsa yok).

export type Lesson = {
  id: string;
  title: string;
  bunnyId: string;
};

export type Training = {
  id: string; // ds_products.id ile aynı
  title: string;
  tagline: string;
  topics: string[];
  previewVideo: string; // Bunny GUID (tanıtım) — boşsa "yakında"
  previewYouTube?: string; // YouTube ID (tanıtım) — varsa Bunny yerine bu kullanılır
  lessons: Lesson[];
  price: number;
  productQuery: string;
  href?: string;
};

export const TRAININGS: Training[] = [
  {
    id: "investor_training",
    title: "Yatırımcı Sunumu Hazırlama",
    tagline: "Yatırım almış gerçek bir sunum üzerinden, slayt slayt püf noktaları.",
    topics: [
      "Problem & Çözüm Anlatımı",
      "Pazar Büyüklüğü & Rakip Analizi",
      "Ekip Kurma & Yatırımcıya Güven",
      "İş Modeli & Gelir Mantığı",
      "Yatırım Almış Gerçek Sunum İncelemesi",
    ],
    previewVideo: "e4eaa2c2-d65a-4f0a-a52d-9ee72dbe843e", // Giriş / tanıtım
    lessons: [
      { id: "inv_1", title: "Bölüm 1: Problem, Çözüm & Pazar", bunnyId: "76823b92-da97-4f09-9f23-1ec20242f121" },
      { id: "inv_2", title: "Bölüm 2: Rakip Analizi & Konumlandırma", bunnyId: "fcae89d4-6a90-4b17-9819-6a30e4c964ac" },
      { id: "inv_3", title: "Bölüm 3: Ekip & İş Modeli", bunnyId: "dd420a26-8a2b-423f-a496-49b339745ec5" },
      { id: "inv_4", title: "Bölüm 4: Gerçek Sunum İncelemesi & Püf Noktaları", bunnyId: "579123ca-2f23-4467-bf60-8415f7f2e8b0" },
    ],
    price: 70,
    productQuery: "investor_training",
    href: "/investor-training",
  },
  {
    id: "startup_giris",
    title: "Startup Giriş Rehberi",
    tagline: "Bir startupta neler olmalı? Baştan sona doğru kurulum, kendi ve dünya örnekleriyle.",
    topics: [
      "Doğru İnovasyon",
      "Over-Engineering (Mühendis Hastalığı) & Kurtulma Yolları",
      "Marka Konumlandırma",
      "MVP Geliştirme",
      "Ekip Kurma",
      "Rakip Analizi",
      "En Sık Yapılan Hatalar",
    ],
    previewVideo: "",
    previewYouTube: "OjwI_kngp4U", // geçici tanıtım (YouTube)
    lessons: [
      { id: "s101_1", title: "Bölüm 1: Doğru İnovasyon & Mühendis Hastalığı", bunnyId: "d7288881-6e80-408e-aca1-474730cac396" },
      { id: "s101_2", title: "Bölüm 2: Marka Konumlandırma & MVP", bunnyId: "1270456c-567d-4388-8338-1747cbda6948" },
      { id: "s101_3", title: "Bölüm 3: Ekip, Rakip Analizi & En Sık Hatalar", bunnyId: "d2757b62-d01f-484a-a84d-5e7eb8f89785" },
    ],
    price: 70,
    productQuery: "startup_giris",
    href: "/startup-giris",
  },
  {
    id: "degerleme",
    title: "Startup Değerleme & Yatırımcı Pazarlığı",
    tagline: "Şirketini doğru değerle, masaya güçlü otur.",
    topics: [
      "Berkus Yöntemi",
      "Puan Kartı (Scorecard) Yöntemi",
      "Risk Faktörleri",
      "DCF — İndirgenmiş Nakit Akışı",
      "Yatırımcılarla Pazarlık",
    ],
    previewVideo: "",
    previewYouTube: "1VW8cSbL_Mw", // geçici tanıtım (YouTube)
    lessons: [
      { id: "deg_1", title: "Değerleme (Tek Parça · 50 dk): Berkus, Puan Kartı, DCF & Pazarlık", bunnyId: "b36d4ad3-5f99-4ca0-95a2-2f75e529e683" },
    ],
    price: 70,
    productQuery: "degerleme",
    href: "/degerleme",
  },
];

export const BUNDLE = {
  id: "all_access_bundle",
  title: "Tüm Eğitimler Paketi",
  tagline: "3 eğitimin tamamı — tek tek almaya göre çok daha avantajlı.",
  price: 99,
  productQuery: "all_access_bundle",
};

// E-kitap alana eğitimlerde %50 (tek eğitim $70 → $35). Checkout'ta otomatik uygulanır.
export const EBOOK_DISCOUNT_CODE = "EBOOK50";
export const DISCOUNTED_TRAINING_PRICE = 35;

export const getTraining = (id: string) => TRAININGS.find((t) => t.id === id);

// Video kapak teması (BunnyEmbed poster) — eğitim başına accent + alt başlık.
const COVER_ACCENT: Record<string, "cyan" | "violet" | "amber"> = {
  investor_training: "cyan",
  startup_giris: "violet",
  degerleme: "amber",
};

export const trainingPoster = (id: string) => {
  const t = getTraining(id);
  if (!t) return undefined;
  const lessonCount = t.lessons.length;
  return {
    title: t.title,
    subtitle: `${lessonCount} bölüm · Önizleme ücretsiz`,
    accent: COVER_ACCENT[id] || "cyan",
  } as const;
};
