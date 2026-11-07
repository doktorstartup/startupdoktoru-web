"use client";

import { useEffect, type RefObject } from "react";
import { track } from "./track";

// Gömülü video izleme olayları: başladı, yarısı, bitti (video başına en fazla 3 olay).
// API betiği yüklemeden iframe'in postMessage protokolünü dinler:
// - YouTube: "listening" el sıkışması → initialDelivery/infoDelivery (currentTime, duration, playerState)
// - Bunny: player.js → timeupdate ({ seconds, duration }) ve ended
// Onay yoksa track() olayı kimliksiz gönderir.

type Kaynak = "youtube" | "bunny";
type Mesaj = Record<string, unknown>;

export function useVideoTakip(
  ref: RefObject<HTMLIFrameElement | null>,
  kaynak: Kaynak,
  videoId: string,
  aktif: boolean
) {
  useEffect(() => {
    const iframe = ref.current;
    if (!aktif || !iframe || !videoId) return;

    track("video_start", { video_id: videoId });
    let yari = false;
    let bitti = false;
    let sure = 0;

    const ilerleme = (sn: number) => {
      if (!sure) return;
      if (!yari && sn / sure >= 0.5) {
        yari = true;
        track("video_50", { video_id: videoId });
      }
      if (!bitti && sn / sure >= 0.95) bitir();
    };
    const bitir = () => {
      if (bitti) return;
      bitti = true;
      track("video_complete", { video_id: videoId });
    };

    const gonder = (m: Mesaj) => iframe.contentWindow?.postMessage(JSON.stringify(m), "*");
    const abone = () => {
      if (kaynak === "youtube") {
        gonder({ event: "listening", id: videoId, channel: "widget" });
      } else {
        for (const value of ["timeupdate", "ended"]) {
          gonder({ context: "player.js", version: "0.0.11", method: "addEventListener", value });
        }
      }
    };

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      let d: Mesaj;
      try {
        d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!d || typeof d !== "object") return;

      if (kaynak === "youtube") {
        const info = d.info as Mesaj | undefined;
        // Süre (duration) yalnız ilk mesajda (initialDelivery) gelir.
        if ((d.event !== "infoDelivery" && d.event !== "initialDelivery") || !info) return;
        if (typeof info.duration === "number" && info.duration > 0) sure = info.duration;
        if (typeof info.currentTime === "number") ilerleme(info.currentTime);
        if (info.playerState === 0) bitir();
      } else {
        if (d.context !== "player.js") return;
        if (d.event === "ready") abone();
        if (d.event === "ended") bitir();
        const v = d.value as Mesaj | undefined;
        if (d.event === "timeupdate" && v) {
          if (typeof v.duration === "number" && v.duration > 0) sure = v.duration;
          if (typeof v.seconds === "number") ilerleme(v.seconds);
        }
      }
    };

    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", abone);
    return () => {
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", abone);
    };
  }, [ref, kaynak, videoId, aktif]);
}
