import { useState, useContext, createContext } from "react";
import { t as translate, type Locale, type TranslationKey, getSavedLocale, saveLocale } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
};

export const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => translate(key, "en"),
});

const SUPPORTED_LOCALES: Locale[] = ["en", "id"];

function updateUrlLocale(locale: Locale): void {
  try {
    const hash = window.location.hash; // e.g. "#/en/faraid" or "#/faraid"
    const path = hash.startsWith("#/") ? hash.slice(2) : hash.slice(1) || "";
    const segments = path.split("/").filter(Boolean);
    const hasLangPrefix = segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as Locale);
    const restSegments = hasLangPrefix ? segments.slice(1) : segments;
    const newPath = restSegments.length > 0 ? restSegments.join("/") : "";
    window.location.hash = "#/" + locale + (newPath ? "/" + newPath : "");
  } catch { /* noop */ }
}

export function useLocaleState(): LocaleContextValue {
  const [locale, setLocaleRaw] = useState<Locale>(getSavedLocale);

  const setLocale = (l: Locale) => {
    saveLocale(l);
    setLocaleRaw(l);
    updateUrlLocale(l);
  };

  const t = (key: TranslationKey) => translate(key, locale);

  return { locale, setLocale, t };
}

export function useLocale() {
  return useContext(LocaleContext);
}
