import { readFileSync } from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Kitabın kişiye özel kopyası: iç kapağa ithaf gibi duran "Bu kopya <ad> için
// hazırlandı" bloğu, iç sayfaların altına küçük ad + e-posta izi. Kapaklara
// (ilk ve son sayfa) dokunulmaz. Font diskten okunur (Türkçe karakterler için);
// Vercel paketine next.config'teki outputFileTracingIncludes ile girer.
const FONT_DIZINI = path.join(process.cwd(), "src/assets/fonts");

export async function kisiyeOzelKopya(kaynak: ArrayBuffer | Uint8Array, ad: string, email: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(kaynak);
  pdf.registerFontkit(fontkit);
  const normal = await pdf.embedFont(readFileSync(path.join(FONT_DIZINI, "NotoSerif-Regular.ttf")), { subset: true });
  const italik = await pdf.embedFont(readFileSync(path.join(FONT_DIZINI, "NotoSerif-Italic.ttf")), { subset: true });

  const koyu = rgb(0.12, 0.12, 0.12);
  const gri = rgb(0.55, 0.55, 0.55);
  const sayfalar = pdf.getPages();
  const tarih = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(new Date());

  // İç kapak (kapaktan sonraki ilk sayfa): ithaf gibi duran kısa blok
  const icKapak = sayfalar[1];
  const { width: g, height: y } = icKapak.getSize();
  const ortala = (metin: string, font: typeof normal, boyut: number, yuk: number, renk = koyu) =>
    icKapak.drawText(metin, { x: (g - font.widthOfTextAtSize(metin, boyut)) / 2, y: yuk, size: boyut, font, color: renk });
  ortala("Bu kopya", italik, 11, y * 0.6 + 34);
  ortala(ad || email, normal, 17, y * 0.6 + 8);
  ortala("için hazırlandı.", italik, 11, y * 0.6 - 14);
  ortala(tarih, italik, 8, y * 0.6 - 36, gri);

  // İç sayfaların alt kenarı: küçük, okumayı bozmayan iz
  const iz = ad ? `${ad} · ${email} için kişiye özel kopya` : `${email} için kişiye özel kopya`;
  for (const sayfa of sayfalar.slice(1, -1)) {
    const { width } = sayfa.getSize();
    sayfa.drawText(iz, { x: (width - normal.widthOfTextAtSize(iz, 6)) / 2, y: 10, size: 6, font: normal, color: gri });
  }

  pdf.setTitle("Hedef Milyon Dolar");
  pdf.setAuthor("Eser Memişoğlu");
  pdf.setSubject(`Kişiye özel kopya: ${ad || email}`);

  return pdf.save();
}
