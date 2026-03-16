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

export function useLocaleState(): LocaleContextValue {
  const [locale, setLocaleRaw] = useState<Locale>(getSavedLocale);

  const setLocale = (l: Locale) => {
    saveLocale(l);
    setLocaleRaw(l);
  };

  const t = (key: TranslationKey) => translate(key, locale);

  return { locale, setLocale, t };
}

export function useLocale() {
  return useContext(LocaleContext);
}
