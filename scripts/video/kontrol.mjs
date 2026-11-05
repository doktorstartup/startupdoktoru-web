// Yayın öncesi açılış kontrolü: kesilmiş kelime zamanlarından, ağır işlem yok.
// İlk 1 sn'de konuşma başlamalı; kelimeler arasında ölü an olmamalı.
export const ILK_KONUSMA_SN = 1;
export const OLU_AN_SN = 1.5;

export function acilisKontrol({ kelimeler, sure }) {
  if (!kelimeler.length) return ["Konuşma bulunamadı."];
  const uyari = [];
  if (kelimeler[0].s > ILK_KONUSMA_SN) uyari.push(`Konuşma ${kelimeler[0].s.toFixed(1)}. sn'de başlıyor.`);
  for (let i = 1; i < kelimeler.length; i++) {
    const bosluk = kelimeler[i].s - kelimeler[i - 1].e;
    if (bosluk > OLU_AN_SN) uyari.push(`Ölü an: ${kelimeler[i - 1].e.toFixed(1)}. sn'de ${bosluk.toFixed(1)} sn sessizlik.`);
  }
  const son = sure - kelimeler.at(-1).e;
  if (son > OLU_AN_SN) uyari.push(`Son kelimeden sonra ${son.toFixed(1)} sn boşluk.`);
  return uyari;
}
