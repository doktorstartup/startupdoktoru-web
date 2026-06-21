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

function getUtm() {
  if (typeof window === "undefined") return {};
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get("utm_source") || undefined,
      utm_medium: p.get("utm_medium") || undefined,
      utm_campaign: p.get("utm_campaign") || undefined,
    };
  } catch {
    return {};
  }
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
