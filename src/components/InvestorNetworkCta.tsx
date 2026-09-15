"use client";

import Link from "next/link";
import { ArrowRight, Users, Sparkles, GraduationCap, ShieldCheck } from "lucide-react";
import { useHref, useLang } from "../lib/i18n-client";

// Ana sayfa kayıt sürücüsü: "içeride yüzlerce yatırımcı var" vurgusuyla ücretsiz kayda yönlendirir.
// Problem + Testimonials'ın hemen ardında konumlanır; ikna momentumunu kayda çevirir.
// Zorlamayan ton: kayıt ücretsiz, kredi kartı yok. Kayıt sonrası mevcut değer merdiveni satışa devam eder.
export function InvestorNetworkCta() {
  const href = useHref();
  const en = useLang() === "en";

  const bullets = en
    ? [
        { icon: Users, text: "Hundreds of real investors already in the system" },
        { icon: Sparkles, text: "We match you to investors that fit your thesis" },
        { icon: GraduationCap, text: "Trainings get you investment-ready" },
      ]
    : [
        { icon: Users, text: "Sistemde kayıtlı yüzlerce gerçek yatırımcı" },
        { icon: Sparkles, text: "Tezine uyan yatırımcılarla biz eşleştiriyoruz" },
        { icon: GraduationCap, text: "Eğitimlerle girişimini yatırıma hazırlıyoruz" },
      ];

  return (
    <section id="investor-network" className="py-20 md:py-28 max-w-7xl mx-auto px-6 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.10] via-background to-accent/[0.06] p-8 sm:p-12">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 text-primary text-sm font-bold tracking-widest uppercase mb-4">
            <ShieldCheck className="h-4 w-4" /> {en ? "Investor Network" : "Yatırımcı Ağı"}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            {en
              ? "Hundreds of investors are looking for the right startup. Yours could be next."
              : "Sistemimizde kayıtlı yüzlerce yatırımcı, doğru girişimi arıyor. Sıradaki seninki olabilir."}
          </h2>
          <p className="text-muted-foreground text-lg mt-5">
            {en
              ? "Get investment-ready and we'll introduce you to investors that fit — for free. Create your account, build your startup profile, and let us do the matching."
              : "Girişimini yatırıma hazır hale getir; sana uygun yatırımcılarla biz tanıştıralım — üstelik ücretsiz. Hesabını oluştur, girişim profilini doldur, eşleştirmeyi bize bırak."}
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {bullets.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.text} className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-foreground/90 leading-snug pt-1">{b.text}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-9">
            <Link href={`${href("/portal/course")}#kayit`} className="btn btn-primary btn-lg">
              {en ? "Create your free account" : "Ücretsiz Kayıt Ol"} <ArrowRight className="h-5 w-5" />
            </Link>
            <span className="text-xs text-muted-foreground">
              {en ? "Free to join · No credit card needed" : "Kayıt ücretsiz · Kredi kartı gerekmez"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
