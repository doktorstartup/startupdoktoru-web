// Hafif istemci tarafı olay takibi. session_id'yi localStorage'da tutar,
// UTM parametrelerini URL'den okur ve /api/track'a POST eder.
// Hata durumunda sessizce yutar — takip asla kullanıcı akışını bozmamalı.

export type EventType = "page_view" | "lead" | "purchase" | "popup_view" | "popup_submit";

const SESSION_KEY = "ds_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

const ATTR_KEY = "ds_attr";
const ATTR_GUN = 30;

type Attr = { utm_source?: string; utm_medium?: string; utm_campaign?: string };

// Kampanya kaynağı YALNIZ giriş adresinde bulunur; ziyaretçi ikinci sayfaya
// geçtiğinde URL'den düşer. Böyle olunca lead ve satış olayları "kaynak yok"
// diye kaydediliyordu — yani Instagram'dan gelen satış görünmüyordu.
// Kaynak artık saklanıyor ve oturum boyunca her olaya ekleniyor.
// Son dokunuş kazanır: yeni bir kampanya bağlantısıyla gelen ziyaretçinin
// kaynağı güncellenir. 30 gün sonra düşer, eski kampanya yeni satışa yazılmasın.
function getUtm(): Attr {
  if (typeof window === "undefined") return {};

  let simdiki: Attr = {};
  try {
    const p = new URLSearchParams(window.location.search);
    const kaynak = p.get("utm_source") || undefined;
    const arac = p.get("utm_medium") || undefined;
    const kampanya = p.get("utm_campaign") || undefined;
    if (kaynak || arac || kampanya) {
      simdiki = { utm_source: kaynak, utm_medium: arac, utm_campaign: kampanya };
    }
  } catch {
    /* URL okunamadıysa saklanana bak */
  }

  try {
    if (simdiki.utm_source || simdiki.utm_medium || simdiki.utm_campaign) {
      localStorage.setItem(ATTR_KEY, JSON.stringify({ ...simdiki, ts: Date.now() }));
      return simdiki;
    }
    const kayitli = localStorage.getItem(ATTR_KEY);
    if (kayitli) {
      const { ts, ...attr } = JSON.parse(kayitli) as Attr & { ts?: number };
      if (ts && Date.now() - ts < ATTR_GUN * 864e5) return attr;
    }
  } catch {
    /* localStorage yoksa URL'dekiyle yetin */
  }

  return simdiki;
}

export function track(
  eventType: EventType,
  extra?: { email?: string; product_id?: string; amount?: number }
): void {
  if (typeof window === "undefined") return;
  const payload = {
    event_type: eventType,
    session_id: getSessionId(),
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    ...getUtm(),
    ...extra,
  };

  try {
    const body = JSON.stringify(payload);
    // sendBeacon, sayfa kapanırken bile gönderimi garantiler (page_view için ideal)
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  } catch {
    // sessizce yut
  }
}
