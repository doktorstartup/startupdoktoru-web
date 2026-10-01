import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyMember } from "../../../../lib/memberAuth";
import { kisiyeOzelKopya } from "../../../../lib/kitapKopya";

// Kişiye özel kitap indirme. Kitabı alan üyeye, adı ve e-postası basılmış bir
// kopya üretir:
//   - iç kapakta "Bu kopya <Ad Soyad> için hazırlandı" (okur kendini özel hissetsin)
//   - her iç sayfanın altında küçük ad + e-posta (adının yazdığı dosyayı
//     gruplara atmaktan çekinsin)
// Kapaklara (ilk ve son sayfa) dokunulmaz.
//
// Kimlik e-posta parametresinden değil, Supabase oturumundan gelir: bu dosya
// dağıtılabilir bir kopya, başkasının adına üretilmemeli.
export const runtime = "nodejs";
export const maxDuration = 30;

const URUN = "ebook_13_steps";

export async function GET(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const { data: siparisler, error: sErr } = await supabaseAdmin
    .from("ds_orders")
    .select("customer_name")
    .eq("payment_status", "paid")
    .eq("product_id", URUN)
    .ilike("email", user.email)
    .order("created_at", { ascending: false });
  if (sErr) {
    console.error("Kitap indirme sipariş sorgusu:", sErr.message);
    return NextResponse.json({ error: "Erişim doğrulanamadı." }, { status: 500 });
  }
  if (!siparisler || siparisler.length === 0) {
    return NextResponse.json({ error: "Bu hesap için kitap erişimi yok." }, { status: 403 });
  }
  const ad = siparisler.map((s) => (s.customer_name || "").trim()).find(Boolean) || "";

  const { data: dosya, error: dErr } = await supabaseAdmin.storage.from("ebooks").download("kitap.pdf");
  if (dErr || !dosya) {
    console.error("Kitap indirme dosya hatası:", dErr?.message);
    return NextResponse.json({ error: "Dosya henüz yüklenmedi.", kod: "yok" }, { status: 404 });
  }

  const bayt = await kisiyeOzelKopya(await dosya.arrayBuffer(), ad, user.email);
  const dosyaAdi = `Hedef-Milyon-Dolar${ad ? "-" + ad : ""}.pdf`;
  const asciiAdi = dosyaAdi.normalize("NFKD").replace(/[^\w.-]+/g, "-");
  return new NextResponse(Buffer.from(bayt), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiAdi}"; filename*=UTF-8''${encodeURIComponent(dosyaAdi)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
