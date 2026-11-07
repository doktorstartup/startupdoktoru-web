// Çerez/izleme onayı (KVKK çerez rehberi). Seçim tarayıcıda tutulur — bu kayıt
// zorunlu sayılır, onay gerektirmez. Onay yoksa track() kimliksiz sayım yapar:
// oturum kimliği, kampanya kaynağı ve e-posta bağlantısı YALNIZ "evet" ile.

export type Onay = "evet" | "hayir";

const ONAY_KEY = "ds_cerez_onay";
export const ONAY_OLAYI = "ds-cerez-onay";

export function onayOku(): Onay | null {
  try {
    const v = localStorage.getItem(ONAY_KEY);
    return v === "evet" || v === "hayir" ? v : null;
  } catch {
    return null;
  }
}

export function onayYaz(v: Onay): void {
  try {
    localStorage.setItem(ONAY_KEY, v);
    // Reddedilince daha önce yazılmış izleme kimliklerini de sil.
    if (v === "hayir") {
      localStorage.removeItem("ds_session_id");
      localStorage.removeItem("ds_attr");
    }
  } catch {
    /* depolama kapalıysa onay bu sayfayla sınırlı kalır */
  }
  window.dispatchEvent(new Event(ONAY_OLAYI));
}

// Footer'daki "Çerez tercihleri": seçimi sil, banner yeniden çıksın.
export function onaySifirla(): void {
  try {
    localStorage.removeItem(ONAY_KEY);
  } catch {
    /* depolama kapalı */
  }
  window.dispatchEvent(new Event(ONAY_OLAYI));
}
