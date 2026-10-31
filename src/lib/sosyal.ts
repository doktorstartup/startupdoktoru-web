import { youtubeSenkron } from "./youtube";
import { instagramSenkron } from "./instagram";

// Tüm platformları paralel senkronla; biri hata verirse diğeri yine yazılır.
export async function sosyalSenkron() {
  const [youtube, instagram] = await Promise.allSettled([youtubeSenkron(), instagramSenkron()]);
  const sonuc = (r: PromiseSettledResult<unknown>) =>
    r.status === "fulfilled" ? r.value : { hata: r.reason instanceof Error ? r.reason.message : String(r.reason) };
  return { ok: youtube.status === "fulfilled" && instagram.status === "fulfilled", youtube: sonuc(youtube), instagram: sonuc(instagram) };
}
