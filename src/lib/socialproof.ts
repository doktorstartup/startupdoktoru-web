// Sosyal kanıt içerikleri — öğrenci memnuniyet videoları ve VC/güvenilir-kaynak görselleri.
// Diziler boşken ilgili bölüm OTOMATİK gizlenir (canlıya sahte içerik gitmez).
// Gerçek içerik geldikçe aşağıyı doldur; görselleri public/ altına koy.

export type Testimonial = {
  name: string; // öğrenci adı
  role?: string; // ör. "Kurucu, FinX"
  quote?: string; // kısa alıntı (video altında görünür)
  youTubeId?: string; // YouTube video ID (varsa)
  bunnyId?: string; // Bunny.net GUID (varsa) — ikisinden biri yeterli
};

export type VcProof = {
  image: string; // public/ altındaki yol, ör. "/vc/fon-ortagi.jpg"
  caption: string; // kısa, DOĞRU açıklama — ör. "X Ventures ekibiyle, İstanbul"
};

// ── Öğrenci memnuniyet videoları ──
// Örnek (gerçek gelince yorum işaretini kaldırıp doldur):
//   { name: "Ayşe K.", role: "Kurucu, FinX", quote: "Yatırımcı görüşmem tamamen değişti.", youTubeId: "XXXXXXXXXXX" },
export const TESTIMONIALS: Testimonial[] = [];

// ── VC'lerle / güvenilir kaynaklarla kareler ──
// Örnek:
//   { image: "/vc/fon-ortagi.jpg", caption: "Tanıtım sunumu — fon ortaklarıyla" },
export const VC_PROOF: VcProof[] = [];

// Bölüm üst metinleri (istediğin gibi düzenle)
export const VC_HEADLINE = "Güçlü Bir Yatırımcı Ağının İçindeyiz";
export const VC_SUBTEXT =
  "Paylaştığımız bilgiler sahadan ve birinci ağızdan: yatırımcılar, fonlar ve gerçek girişimlerle kurduğumuz ilişkilerden geliyor.";
