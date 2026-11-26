// Instagram açıklama denetimi — video teslimi (scripts/video/teslim.mjs) ve carousel kuyruğu (scripts/carousel/kuyruga-al.mjs) kullanır.
// - Etiket: Instagram Aralık 2025'ten beri gönderi başına en fazla 5 hashtag kabul ediyor.
// - İlk satır: akış "... devamı"ndan önce ~125 karakter gösterir; ilk satır bunu aşarsa cümle ortasında kesilir.
export const ETIKET_SINIRI = 5;
export const GORUNEN_KARAKTER = 125;

export function instagramMetinHatalari(metin) {
  const hatalar = [];
  const etiketler = metin.match(/#[\p{L}\p{N}_]+/gu) || [];
  if (etiketler.length > ETIKET_SINIRI) hatalar.push(`${etiketler.length} hashtag var (${etiketler.join(" ")}); Instagram sınırı ${ETIKET_SINIRI}.`);
  const ilk = metin.trim().split("\n")[0];
  if ([...ilk].length > GORUNEN_KARAKTER) hatalar.push(`İlk satır ${[...ilk].length} karakter; akışta ${GORUNEN_KARAKTER}. karakterden sonra kesilir: "${[...ilk].slice(0, GORUNEN_KARAKTER).join("")}…"`);
  return hatalar;
}
