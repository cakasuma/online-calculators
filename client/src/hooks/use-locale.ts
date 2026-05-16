import { useState, useContext, createContext, useEffect } from "react";
import {
  t as translate,
  getSavedLocale,
  saveLocale,
  isLocale,
  SUPPORTED_LOCALES,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

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

function swapPathLocale(nextLocale: Locale) {
  try {
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length > 0 && isLocale(segments[0])) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }
    const newPath = "/" + segments.join("/");
    const search = window.location.search;
    const hash = window.location.hash;
    window.history.pushState({}, "", newPath + search + hash);
    // Wouter listens to popstate; emit a synthetic one so the router re-reads location.
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch { /* noop */ }
}

export function useLocaleState(): LocaleContextValue {
  const [locale, setLocaleRaw] = useState<Locale>(getSavedLocale);

  useEffect(() => {
    const syncLocaleFromUrl = () => {
      const next = getSavedLocale();
      setLocaleRaw((current) => (current === next ? current : next));
    };
    window.addEventListener("popstate", syncLocaleFromUrl);
    return () => window.removeEventListener("popstate", syncLocaleFromUrl);
  }, []);

  const setLocale = (l: Locale) => {
    if (!SUPPORTED_LOCALES.includes(l)) return;
    saveLocale(l);
    setLocaleRaw(l);
    swapPathLocale(l);
  };

  const t = (key: TranslationKey) => translate(key, locale);

  return { locale, setLocale, t };
}

export function useLocale() {
  return useContext(LocaleContext);
}
