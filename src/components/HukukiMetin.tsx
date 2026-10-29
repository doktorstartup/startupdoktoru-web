import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

// Gizlilik / KVKK gibi hukuki metinler için ortak düzen.
// Paragraf içinde "- " ile başlayan satırlar madde listesine dönüşür.

export type Bolum = { baslik: string; metin: string[] };
export type Metin = { baslik: string; guncelleme: string; giris: string[]; bolumler: Bolum[] };

export function HukukiMetin({ metin }: { metin: Metin }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 md:py-20">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{metin.baslik}</h1>
        <p className="text-xs text-muted-foreground mt-2">{metin.guncelleme}</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
          {metin.giris.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {metin.bolumler.map((b) => (
          <section key={b.baslik} className="mt-10">
            <h2 className="text-lg font-bold text-foreground">{b.baslik}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {b.metin.map((p, i) =>
                p.startsWith("- ") ? (
                  <ul key={i} className="list-disc pl-5 space-y-1">
                    {p.split("\n").map((m) => (
                      <li key={m}>{m.replace(/^- /, "")}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                )
              )}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
