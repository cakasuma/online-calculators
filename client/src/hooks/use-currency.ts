import { useState } from "react";

const CURRENCY_KEY = "calc_currency";

export function useCurrency(defaultCurrency = "MYR"): [string, (c: string) => void] {
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      return localStorage.getItem(CURRENCY_KEY) || defaultCurrency;
    } catch {
      return defaultCurrency;
    }
  });

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch { /* noop */ }
  };

  return [currency, setCurrency];
}
