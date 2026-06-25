import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { VC_PROOF, VC_HEADLINE, VC_SUBTEXT } from "../lib/socialproof";

// VC'lerle / güvenilir kaynaklarla kareler — güvenilirlik kanıtı. Görsel yoksa bölüm gizlenir.
export function VcNetwork() {
  if (VC_PROOF.length === 0) return null;

  return (
    <section id="vc-network" className="py-20 md:py-28 max-w-7xl mx-auto px-6 sm:px-8">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="inline-flex items-center gap-2 text-primary text-sm font-bold tracking-widest uppercase mb-3">
          <ShieldCheck className="h-4 w-4" /> Güvenilir Kaynak
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{VC_HEADLINE}</h2>
        <p className="text-muted-foreground text-lg mt-4">{VC_SUBTEXT}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {VC_PROOF.map((v, i) => (
          <figure
            key={i}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/40 shadow-lg"
          >
            <Image
              src={v.image}
              alt={v.caption}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <figcaption className="absolute bottom-0 left-0 right-0 p-3 text-xs font-semibold text-white/90 leading-snug">
              {v.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
