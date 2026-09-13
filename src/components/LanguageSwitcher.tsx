"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, localePath, stripLocale, type Locale } from "../lib/i18n";
import { useLang, useT } from "../lib/i18n-client";

// Bulunulan sayfanın diğer dildeki adresine götürür; ana sayfaya düşürmez.
// available: sayfanın gerçekten var olduğu diller (blog yazısı gibi her dilde
// karşılığı olmayan sayfalarda verilir). Verilmezse tüm diller gösterilir.
export function LanguageSwitcher({ className = "", available }: { className?: string; available?: Locale[] }) {
  const lang = useLang();
  const t = useT();
  const bare = stripLocale(usePathname());
  const shown = available ? LOCALES.filter((l) => available.includes(l)) : LOCALES;

  if (shown.length < 2) return null;

  return (
    <div className={`flex items-center gap-1 text-xs font-semibold ${className}`} aria-label={t.header.switchLanguage}>
      {shown.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-border">/</span>}
          {l === lang ? (
            <span className="text-primary uppercase">{l}</span>
          ) : (
            <Link href={localePath(l, bare)} className="text-muted-foreground hover:text-primary transition-colors uppercase">
              {l}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
