import type { Locale } from "../i18n";
import { tr, type Dict } from "./tr";
import { en } from "./en";

const DICTS: Record<Locale, Dict> = { tr, en };

export function getDict(lang: Locale): Dict {
  return DICTS[lang];
}

export type { Dict };
